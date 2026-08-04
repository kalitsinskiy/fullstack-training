const publishMock = jest.fn();
const assertExchangeMock = jest.fn().mockResolvedValue(undefined);
const createChannelMock = jest.fn().mockResolvedValue({
  publish: publishMock,
  assertExchange: assertExchangeMock,
  close: jest.fn(),
});

const connectMock = jest.fn().mockResolvedValue({
  createChannel: createChannelMock,
  on: jest.fn(),
  close: jest.fn(),
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

describe('EventPublisherService', () => {
  beforeEach(() => jest.clearAllMocks());

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

    const svc = make();

    await svc.onModuleInit();

    expect(() => svc.publish('room.created', {})).not.toThrow();
    expect(publishMock).not.toHaveBeenCalled();
  });
});
