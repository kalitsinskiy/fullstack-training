import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { RoomsController } from '../src/rooms/rooms.controller';
import { RoomsService } from '../src/rooms/rooms.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { WishlistController } from '../src/wishlist/wishlist.controller';
import { WishlistService } from '../src/wishlist/wishlist.service';

describe('App (e2e)', () => {
  let app: INestApplication;

  const usersServiceMock = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  const roomsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    addMember: jest.fn(),
  };

  const wishlistServiceMock = {
    set: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AppController,
        UsersController,
        RoomsController,
        WishlistController,
      ],
      providers: [
        AppService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: RoomsService,
          useValue: roomsServiceMock,
        },
        {
          provide: WishlistService,
          useValue: wishlistServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) returns hello world', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET) returns status ok', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/users (POST) creates a user', async () => {
    const dto = {
      displayName: 'Alice',
      email: 'alice@example.com',
    };
    const createdUser = {
      _id: '64e000000000000000000001',
      ...dto,
    };
    usersServiceMock.create.mockResolvedValue(createdUser);

    await request(app.getHttpServer())
      .post('/users')
      .send(dto)
      .expect(201)
      .expect(createdUser);

    expect(usersServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('/users/:id (GET) returns 404 when user does not exist', async () => {
    usersServiceMock.findById.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/users/64e000000000000000000099')
      .expect(404);
  });

  it('/rooms (POST) validates ownerId format', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({ name: 'My Room', ownerId: 'not-a-uuid' })
      .expect(400);
  });

  it('/rooms/:code/join (POST) returns 404 when room does not exist', async () => {
    roomsServiceMock.findByCode.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/rooms/ABC123/join')
      .send({ userId: '8ad26f7f-b1a5-4e90-8e74-79f4f34b0d9c' })
      .expect(404);
  });

  it('/rooms/:roomCode/wishlist (POST) validates wishlist item structure', async () => {
    await request(app.getHttpServer())
      .post('/rooms/ABC123/wishlist')
      .send({
        userId: '64e000000000000000000001',
        items: ['book'],
      })
      .expect(400);
  });

  it('/rooms/:roomCode/wishlist (POST) upserts wishlist when room and user exist', async () => {
    const roomId = '64e000000000000000000010';
    const userId = '64e000000000000000000001';
    const room = { _id: roomId, inviteCode: 'ABC123' };
    const user = { _id: userId, email: 'alice@example.com' };
    const wishlist = {
      _id: '64e000000000000000000200',
      roomId,
      userId,
      items: [{ name: 'book', priority: 1 }],
    };

    roomsServiceMock.findByCode.mockResolvedValue(room);
    usersServiceMock.findById.mockResolvedValue(user);
    wishlistServiceMock.set.mockResolvedValue(wishlist);

    await request(app.getHttpServer())
      .post('/rooms/ABC123/wishlist')
      .send({ userId, items: [{ name: 'book', priority: 1 }] })
      .expect(201)
      .expect(wishlist);

    expect(roomsServiceMock.findByCode).toHaveBeenCalledWith('ABC123');
    expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);
    expect(wishlistServiceMock.set).toHaveBeenCalledWith(
      room._id,
      user._id,
      wishlist.items,
    );
  });
});
