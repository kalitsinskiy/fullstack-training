import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'http';
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
import { RoomPermissionsGuard } from '../src/rooms/guards/room-permissions.guard';

describe('App (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const server = (): Server => app.getHttpServer();

  const usersServiceMock = {
    findById: jest.fn(),
    updateCurrentUser: jest.fn(),
  };

  const roomsServiceMock = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findByIdForUser: jest.fn(),
    join: jest.fn(),
    joinByCode: jest.fn(),
    draw: jest.fn(),
    getAssignment: jest.fn(),
    editRoom: jest.fn(),
    deleteRoom: jest.fn(),
    kickMember: jest.fn(),
    regenerateInviteCode: jest.fn(),
  };

  const wishlistServiceMock = {
    set: jest.fn(),
    get: jest.fn(),
  };

  const authGuardMock = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context
        .switchToHttp()
        .getRequest<{ user: { id: string } }>();
      request.user = { id: '64e000000000000000000001' };
      return true;
    }),
  };

  const roomPermissionsGuardMock = {
    canActivate: jest.fn(() => true),
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
        { provide: UsersService, useValue: usersServiceMock },
        { provide: RoomsService, useValue: roomsServiceMock },
        { provide: WishlistService, useValue: wishlistServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(authGuardMock)
      .overrideGuard(RoomPermissionsGuard)
      .useValue(roomPermissionsGuardMock)
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
    await request(server()).get('/').expect(200).expect('Hello World!');
  });

  it('/health (GET) returns status ok', async () => {
    await request(server()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('/users/me (GET) returns the current user', async () => {
    const id = '64e000000000000000000001';
    const user = {
      id,
      email: 'alice@example.com',
      displayName: 'Alice',
      role: 'user',
    };
    usersServiceMock.findById.mockResolvedValue(user);

    await request(server()).get('/users/me').expect(200).expect(user);

    expect(usersServiceMock.findById).toHaveBeenCalledWith(id);
  });

  it('/users/me (PATCH) updates the current user', async () => {
    const id = '64e000000000000000000001';
    const updates = { displayName: 'Alice Updated' };
    const updatedUser = {
      id,
      email: 'alice@example.com',
      displayName: 'Alice Updated',
      role: 'user',
    };
    usersServiceMock.updateCurrentUser.mockResolvedValue(updatedUser);

    await request(server())
      .patch('/users/me')
      .send(updates)
      .expect(200)
      .expect(updatedUser);

    expect(usersServiceMock.updateCurrentUser).toHaveBeenCalledWith(
      id,
      updates,
    );
  });

  it('/rooms (POST) validates request body', async () => {
    await request(server()).post('/rooms').send({}).expect(400);
  });

  it('/rooms (POST) creates a room', async () => {
    const room = {
      id: '64e000000000000000000010',
      name: 'My Room',
      status: 'pending',
    };
    roomsServiceMock.create.mockResolvedValue(room);

    await request(server())
      .post('/rooms')
      .send({ name: 'My Room' })
      .expect(201)
      .expect(room);

    expect(roomsServiceMock.create).toHaveBeenCalledWith(
      { name: 'My Room' },
      '64e000000000000000000001',
    );
  });

  it('/rooms/:id (PATCH) updates a room', async () => {
    const id = '64e000000000000000000010';
    const updates = { name: 'Updated Room Name' };
    const updatedRoom = { id, name: 'Updated Room Name', status: 'pending' };
    roomsServiceMock.editRoom.mockResolvedValue(updatedRoom);

    await request(server())
      .patch(`/rooms/${id}`)
      .send(updates)
      .expect(200)
      .expect(updatedRoom);

    expect(roomsServiceMock.editRoom).toHaveBeenCalledWith(
      id,
      updates,
      '64e000000000000000000001',
    );
  });

  it('/rooms/:id (DELETE) removes a room', async () => {
    const id = '64e000000000000000000010';
    roomsServiceMock.deleteRoom.mockResolvedValue(undefined);

    await request(server()).delete(`/rooms/${id}`).expect(204);

    expect(roomsServiceMock.deleteRoom).toHaveBeenCalledWith(id);
  });

  it('/rooms/:roomId/wishlist (PUT) upserts wishlist', async () => {
    const roomId = new Types.ObjectId().toString();
    const userId = '64e000000000000000000001';
    const wishlist = { roomId, userId, items: ['book'] };
    wishlistServiceMock.set.mockResolvedValue(wishlist);

    await request(server())
      .put(`/rooms/${roomId}/wishlist`)
      .send({ items: ['book'] })
      .expect(200)
      .expect(wishlist);

    expect(wishlistServiceMock.set).toHaveBeenCalledWith(roomId, userId, [
      'book',
    ]);
  });

  it('/rooms/:roomId/wishlist (PUT) validates item structure', async () => {
    const roomId = new Types.ObjectId().toString();

    await request(server())
      .put(`/rooms/${roomId}/wishlist`)
      .send({ items: [{ notAString: true }] })
      .expect(400);
  });
});
