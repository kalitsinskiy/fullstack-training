// ============================================
// Unit Testing a Service (with Mocked Dependencies)
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/examples/unit-test-service.spec.ts

// --- The service under test ---

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
}

interface CreateItemDto {
  name: string;
  description: string;
  price: number;
}

interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  inStock?: boolean;
}

// Simulated Mongoose model interface
interface ItemModel {
  create(data: any): Promise<Item>;
  find(filter?: any): any;
  findById(id: string): any;
  findByIdAndUpdate(id: string, data: any, options?: any): Promise<Item | null>;
  findByIdAndDelete(id: string): Promise<Item | null>;
  countDocuments(filter?: any): Promise<number>;
}

class ItemsService {
  constructor(private readonly itemModel: ItemModel) {}

  async create(dto: CreateItemDto): Promise<Item> {
    if (dto.price < 0) {
      throw new Error('Price cannot be negative');
    }
    return this.itemModel.create({ ...dto, inStock: true });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Item[]; total: number }> {
    const skip = (page - 1) * limit;
    const data = await this.itemModel.find().sort({ name: 1 }).skip(skip).limit(limit);
    const total = await this.itemModel.countDocuments();
    return { data, total };
  }

  async findById(id: string): Promise<Item> {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.itemModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async delete(id: string): Promise<void> {
    const item = await this.itemModel.findByIdAndDelete(id);
    if (!item) {
      throw new Error('Item not found');
    }
  }

  async toggleStock(id: string): Promise<Item> {
    const item = await this.findById(id);
    return this.update(id, { inStock: !item.inStock });
  }
}

// --- Tests ---

describe('ItemsService', () => {
  let service: ItemsService;
  let mockModel: jest.Mocked<ItemModel>;

  // Helper to create a mock item
  function createMockItem(overrides: Partial<Item> = {}): Item {
    return {
      _id: 'item-1',
      name: 'Test Item',
      description: 'A test item',
      price: 29.99,
      inStock: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    service = new ItemsService(mockModel);
  });

  // --- create ---
  describe('create', () => {
    it('should create an item with inStock: true', async () => {
      const dto: CreateItemDto = { name: 'Widget', description: 'A widget', price: 9.99 };
      const expected = createMockItem({ ...dto, inStock: true });

      mockModel.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(mockModel.create).toHaveBeenCalledWith({
        name: 'Widget',
        description: 'A widget',
        price: 9.99,
        inStock: true,
      });
      expect(result).toEqual(expected);
    });

    it('should throw if price is negative', async () => {
      const dto: CreateItemDto = { name: 'Bad', description: 'Bad item', price: -5 };

      await expect(service.create(dto)).rejects.toThrow('Price cannot be negative');
      expect(mockModel.create).not.toHaveBeenCalled();
    });
  });

  // --- findById ---
  describe('findById', () => {
    it('should return the item if found', async () => {
      const item = createMockItem();
      mockModel.findById.mockResolvedValue(item);

      const result = await service.findById('item-1');

      expect(mockModel.findById).toHaveBeenCalledWith('item-1');
      expect(result).toEqual(item);
    });

    it('should throw if item not found', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Item not found');
    });
  });

  // --- update ---
  describe('update', () => {
    it('should update and return the item', async () => {
      const updated = createMockItem({ name: 'Updated Widget' });
      mockModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update('item-1', { name: 'Updated Widget' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'item-1',
        { name: 'Updated Widget' },
        { new: true },
      );
      expect(result.name).toBe('Updated Widget');
    });

    it('should throw if item not found during update', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow('Item not found');
    });
  });

  // --- delete ---
  describe('delete', () => {
    it('should delete the item', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(createMockItem());

      await expect(service.delete('item-1')).resolves.toBeUndefined();
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('item-1');
    });

    it('should throw if item not found during delete', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow('Item not found');
    });
  });

  // --- toggleStock ---
  describe('toggleStock', () => {
    it('should toggle inStock from true to false', async () => {
      const item = createMockItem({ inStock: true });
      const toggled = createMockItem({ inStock: false });

      mockModel.findById.mockResolvedValue(item);
      mockModel.findByIdAndUpdate.mockResolvedValue(toggled);

      const result = await service.toggleStock('item-1');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'item-1',
        { inStock: false },
        { new: true },
      );
      expect(result.inStock).toBe(false);
    });

    it('should toggle inStock from false to true', async () => {
      const item = createMockItem({ inStock: false });
      const toggled = createMockItem({ inStock: true });

      mockModel.findById.mockResolvedValue(item);
      mockModel.findByIdAndUpdate.mockResolvedValue(toggled);

      const result = await service.toggleStock('item-1');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'item-1',
        { inStock: true },
        { new: true },
      );
      expect(result.inStock).toBe(true);
    });
  });

  // --- findAll ---
  describe('findAll', () => {
    it('should return paginated results', async () => {
      const items = [createMockItem({ _id: '1' }), createMockItem({ _id: '2' })];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(items),
          }),
        }),
      });
      mockModel.countDocuments.mockResolvedValue(15);

      const result = await service.findAll(2, 5);

      expect(result.data).toEqual(items);
      expect(result.total).toBe(15);
    });
  });
});
