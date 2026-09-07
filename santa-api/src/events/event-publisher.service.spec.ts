const publishMock = jest.fn();
const assertExchangeMock = jest.fn().mockResolvedValue(undefined);
const channelOnMock = jest.fn();
const channelCloseMock = jest.fn().mockResolvedValue(undefined);
const connectionOnMock = jest.fn();
const connectionCloseMock = jest.fn().mockResolvedValue(undefined);

const createChannelMock = jest.fn().mockResolvedValue({
  publish: publishMock,
  assertExchange: assertExchangeMock,
  close: channelCloseMock,
  on: channelOnMock,
});

const connectMock = jest.fn().mockResolvedValue({
  createChannel: createChannelMock,
  on: connectionOnMock,
  close: connectionCloseMock,
});

jest.mock('amqplib', () => ({ connect: connectMock }));

import type { ConfigService } from '@nestjs/config';
import { EventPublisherService } from './event-publisher.service';

function make(): EventPublisherService {
  const config = {
    getOrThrow: () => 'amqp://localhost:5672',
  } as unknown as ConfigService;
  return new EventPublisherService(config);
}

function handlerFor(mock: jest.Mock, event: string): () => void {
  const calls = mock.mock.calls as [string, () => void][];
  const call = calls.find(([name]) => name === event);

  if (!call) throw new Error(`no "${event}" handler registered`);

  return call[1];
}

describe('EventPublisherService', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());

  it('asserts the topic exchange on init', async () => {
    const svc = make();
    await svc.onModuleInit();

    expect(assertExchangeMock).toHaveBeenCalledWith('santa.events', 'topic', {
      durable: true,
    });
  });

  it('publishes with routing key, JSON buffer, and persistent + messageId options', async () => {
    const svc = make();
    await svc.onModuleInit();

    svc.publish('room.created', { roomId: 'r1', roomName: 'Office' });

    expect(publishMock).toHaveBeenCalledTimes(1);

    const [exchange, routingKey, buffer, opts] = publishMock.mock.calls[0] as [
      string,
      string,
      Buffer,
      { messageId?: string; persistent?: boolean; contentType?: string },
    ];

    expect(exchange).toBe('santa.events');
    expect(routingKey).toBe('room.created');
    expect(JSON.parse(buffer.toString())).toEqual({
      roomId: 'r1',
      roomName: 'Office',
    });
    expect(opts).toMatchObject({
      persistent: true,
      contentType: 'application/json',
    });
    expect(typeof opts.messageId).toBe('string');
  });

  it('no-ops (does not throw) when the broker was unavailable at startup', async () => {
    connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    jest.useFakeTimers();

    const svc = make();

    await svc.onModuleInit();

    expect(() => svc.publish('room.created', {})).not.toThrow();
    expect(publishMock).not.toHaveBeenCalled();

    await svc.onModuleDestroy();
  });

  it('retries with backoff when the broker is down at startup, and publishes once it heals', async () => {
    connectMock
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));
    jest.useFakeTimers();

    const svc = make();
    await svc.onModuleInit();

    await jest.advanceTimersByTimeAsync(1000);
    expect(connectMock).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1000);
    expect(connectMock).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1000);
    expect(connectMock).toHaveBeenCalledTimes(3);

    svc.publish('room.created', { roomId: 'r1' });
    expect(publishMock).toHaveBeenCalledTimes(1);

    await svc.onModuleDestroy();
  });

  it('reconnects after the connection closes mid-flight', async () => {
    jest.useFakeTimers();

    const svc = make();
    await svc.onModuleInit();

    handlerFor(connectionOnMock, 'close')();

    svc.publish('room.created', {});
    expect(publishMock).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);

    expect(connectMock).toHaveBeenCalledTimes(2);

    svc.publish('room.created', {});
    expect(publishMock).toHaveBeenCalledTimes(1);

    await svc.onModuleDestroy();
  });

  it('recycles the connection when only the channel dies', async () => {
    const svc = make();
    await svc.onModuleInit();

    handlerFor(channelOnMock, 'close')();

    expect(connectionCloseMock).toHaveBeenCalledTimes(1);

    await svc.onModuleDestroy();
  });

  it('stops retrying after the module is destroyed', async () => {
    connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    jest.useFakeTimers();

    const svc = make();
    await svc.onModuleInit();
    await svc.onModuleDestroy();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(connectMock).toHaveBeenCalledTimes(1);
  });
});
