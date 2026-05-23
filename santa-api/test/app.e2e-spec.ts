import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Types } from 'mongoose';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { RoomsController } from '../src/rooms/rooms.controller';
import { RoomsService } from '../src/rooms/rooms.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { WishlistController } from '../src/wishlist/wishlist.controller';
import { WishlistService } from '../src/wishlist/wishlist.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('App (e2e)', () => {
  let app: INestApplication;

  const usersServiceMock = {
    create: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };

  const roomsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    addMember: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };

  const wishlistServiceMock = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const authGuardMock = {
    canActivate: jest.fn((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: '64e000000000000000000001' };
      return true;
    }),
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(authGuardMock)
      .compile();

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
      passwordHash: 'supersecret123',
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
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
      [{ name: 'book', priority: 1, url: undefined }],
    );
  });

  it('/users/me (PATCH) updates current user', async () => {
    const id = '64e000000000000000000001';
    const updates = { displayName: 'Alice Updated' };
    const updatedUser = { _id: id, email: 'alice@example.com', displayName: 'Alice Updated' };
    usersServiceMock.updateById.mockResolvedValue(updatedUser);

    await request(app.getHttpServer())
      .patch('/users/me')
      .send(updates)
      .expect(200)
      .expect(updatedUser);

    expect(usersServiceMock.updateById).toHaveBeenCalledWith(id, updates);
  });

  it('/users/me (DELETE) deletes current user', async () => {
    const id = '64e000000000000000000001';
    usersServiceMock.deleteById.mockResolvedValue(true);

    await request(app.getHttpServer())
      .delete('/users/me')
      .expect(200)
      .expect({ success: true });

    expect(usersServiceMock.deleteById).toHaveBeenCalledWith(id);
  });

  it('/rooms/:id (PATCH) updates a room', async () => {
    const id = '64e000000000000000000010';
    const updates = { name: 'Updated Room Name' };
    const updatedRoom = { _id: id, name: 'Updated Room Name' };
    roomsServiceMock.updateById.mockResolvedValue(updatedRoom);

    await request(app.getHttpServer())
      .patch(`/rooms/${id}`)
      .send(updates)
      .expect(200)
      .expect(updatedRoom);

    expect(roomsServiceMock.updateById).toHaveBeenCalledWith(id, updates);
  });

  it('/rooms/:id (DELETE) removes a room', async () => {
    const id = '64e000000000000000000010';
    roomsServiceMock.deleteById.mockResolvedValue(true);

    await request(app.getHttpServer())
      .delete(`/rooms/${id}`)
      .expect(200)
      .expect({ success: true });

    expect(roomsServiceMock.deleteById).toHaveBeenCalledWith(id);
  });

  it('/rooms/:roomCode/wishlist/:userId (PATCH) updates wishlist items', async () => {
    const roomId = '64e000000000000000000010';
    const userId = '64e000000000000000000001';
    const room = { _id: roomId, inviteCode: 'ABC123' };
    const user = { _id: userId, email: 'alice@example.com' };
    const updatedWishlist = {
      _id: '64e000000000000000000200',
      roomId,
      userId,
      items: [{ name: 'updated-book', priority: 2 }],
    };

    roomsServiceMock.findByCode.mockResolvedValue(room);
    usersServiceMock.findById.mockResolvedValue(user);
    wishlistServiceMock.set.mockResolvedValue(updatedWishlist);

    await request(app.getHttpServer())
      .patch('/rooms/ABC123/wishlist/64e000000000000000000001')
      .send({ items: [{ name: 'updated-book', priority: 2 }] })
      .expect(200)
      .expect(updatedWishlist);

    expect(wishlistServiceMock.set).toHaveBeenCalledWith(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
      [{ name: 'updated-book', priority: 2, url: undefined }],
    );
  });

  it('/rooms/:roomCode/wishlist/:userId (DELETE) removes wishlist', async () => {
    const roomId = '64e000000000000000000010';
    const userId = '64e000000000000000000001';
    const room = { _id: roomId, inviteCode: 'ABC123' };
    const user = { _id: userId, email: 'alice@example.com' };

    roomsServiceMock.findByCode.mockResolvedValue(room);
    usersServiceMock.findById.mockResolvedValue(user);
    wishlistServiceMock.delete.mockResolvedValue(true);

    await request(app.getHttpServer())
      .delete('/rooms/ABC123/wishlist/64e000000000000000000001')
      .expect(200)
      .expect({ success: true });

    expect(wishlistServiceMock.delete).toHaveBeenCalledWith(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
    );
  });
});
