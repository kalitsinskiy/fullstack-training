import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisherService } from './eventPublisher.service';

jest.mock('amqplib', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const amqp = (require('amqplib') as { default: { connect: jest.Mock } })
  .default;

const mockChannel = {
  assertExchange: jest.fn(),
  publish: jest.fn(),
  close: jest.fn(),
};

const mockConnection = {
  createChannel: jest.fn(),
  close: jest.fn(),
};

describe('EventPublisherService', () => {
  let service: EventPublisherService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockChannel.assertExchange.mockResolvedValue(undefined);
    mockChannel.publish.mockReturnValue(true);
    mockChannel.close.mockResolvedValue(undefined);
    mockConnection.createChannel.mockResolvedValue(mockChannel);
    mockConnection.close.mockResolvedValue(undefined);
    amqp.connect.mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventPublisherService],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('connects and asserts the exchange when RABBITMQ_URL is set', async () => {
      process.env.RABBITMQ_URL = 'amqp://test:test@localhost:5672';

      await service.onModuleInit();

      expect(amqp.connect).toHaveBeenCalledWith(
        'amqp://test:test@localhost:5672',
      );
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'santa.events',
        'topic',
        {
          durable: true,
        },
      );
    });

    it('skips connection when RABBITMQ_URL is not set', async () => {
      delete process.env.RABBITMQ_URL;

      await service.onModuleInit();

      expect(amqp.connect).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    beforeEach(async () => {
      process.env.RABBITMQ_URL = 'amqp://test:test@localhost:5672';
      await service.onModuleInit();
    });

    it('publishes to the santa.events exchange with the routing key', () => {
      service.publish('room.created', {
        roomId: 'abc',
        roomName: 'Party',
        createdBy: 'Alice',
      });

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'santa.events',
        'room.created',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          contentType: 'application/json',
          messageId: expect.any(String) as string,
          timestamp: expect.any(Number) as number,
        }),
      );
    });

    it('generates a unique messageId per publish call', () => {
      service.publish('user.joined', {
        roomId: '1',
        userId: 'u1',
        userName: 'Bob',
      });
      service.publish('user.joined', {
        roomId: '1',
        userId: 'u2',
        userName: 'Carol',
      });

      const opts1 = (
        mockChannel.publish.mock.calls[0] as [
          unknown,
          unknown,
          unknown,
          { messageId: string },
        ]
      )[3];
      const opts2 = (
        mockChannel.publish.mock.calls[1] as [
          unknown,
          unknown,
          unknown,
          { messageId: string },
        ]
      )[3];
      expect(opts1.messageId).not.toBe(opts2.messageId);
    });

    it('does nothing when not configured (no RABBITMQ_URL)', () => {
      delete process.env.RABBITMQ_URL;
      const unconfiguredService = new EventPublisherService();

      unconfiguredService.publish('room.created', { roomId: '1' });

      expect(mockChannel.publish).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('closes the channel and connection when configured', async () => {
      process.env.RABBITMQ_URL = 'amqp://test:test@localhost:5672';
      await service.onModuleInit();

      await service.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('does nothing when not configured', async () => {
      delete process.env.RABBITMQ_URL;
      const unconfiguredService = new EventPublisherService();

      await unconfiguredService.onModuleDestroy();

      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
    });
  });
});
