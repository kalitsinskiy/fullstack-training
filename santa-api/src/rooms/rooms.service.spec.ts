import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsService],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a room', () => {
    const room = service.create({ name: 'Test Room', ownerId: '1' });
    expect(room).toBeDefined();
    expect(room).toHaveProperty('id');
    expect(room).toHaveProperty('code');
    expect(room).toHaveProperty('members');
    expect(room.members).toContain('1');
  });

  it('should create unique ids and codes for different rooms', () => {
    const room1 = service.create({ name: 'Room 1', ownerId: '1' });
    const room2 = service.create({ name: 'Room 2', ownerId: '2' });
    const room3 = service.create({ name: 'Room 1', ownerId: '2' });
    const duplicated = service.create({ name: 'Room 1', ownerId: '1' });

    const ids = new Set([room1.id, room2.id, room3.id, duplicated.id]);
    const codes = new Set([
      room1.code,
      room2.code,
      room3.code,
      duplicated.code,
    ]);

    // Both sets should have 4 unique values, meaning no duplicates
    expect(ids.size).toBe(4);
    expect(codes.size).toBe(4);
  });

  it('should find all rooms', () => {
    service.create({ name: 'Room 1', ownerId: '1' });
    service.create({ name: 'Room 2', ownerId: '2' });
    const rooms = service.findAll();
    expect(rooms.length).toBe(2);
    rooms.forEach((room) => {
      expect(room).toBeDefined();
    });
  });

  it('should return an empty array if no rooms are created', () => {
    const rooms = service.findAll();
    expect(rooms).toEqual([]);
  });

  it('should find a room by id', () => {
    const room = service.create({ name: 'Test Room', ownerId: '1' });
    const foundRoom = service.findById(room.id);
    expect(foundRoom).toEqual(room);
  });

  it('should return undefined if room id not found', () => {
    const foundRoom = service.findById('non-existent-id');
    expect(foundRoom).toBeUndefined();
  });

  it('should find a room by code', () => {
    const room = service.create({ name: 'Test Room', ownerId: '1' });
    const foundRoom = service.findByCode(room.code);
    expect(foundRoom).toEqual(room);
  });

  it('should return undefined if room code not found', () => {
    const foundRoom = service.findByCode('NONEXIST');
    expect(foundRoom).toBeUndefined();
  });

  it('should add a member to a room', () => {
    const room = service.create({ name: 'Test Room', ownerId: '1' });
    const updatedRoom = service.addMember(room.code, '2');
    expect(updatedRoom).toBeDefined();
    expect(updatedRoom?.members).toContain('2');
  });

  it('should not add a member if already in the room', () => {
    const room = service.create({ name: 'Test Room', ownerId: '1' });
    service.addMember(room.code, '2');
    const updatedRoom = service.addMember(room.code, '2');
    expect(updatedRoom).toBeDefined();
    expect(updatedRoom?.members.filter((id) => id === '2').length).toBe(1);
  });

  it('should return undefined when adding a member to a non-existent room', () => {
    const updatedRoom = service.addMember('NONEXIST', '2');
    expect(updatedRoom).toBeUndefined();
  });
});
