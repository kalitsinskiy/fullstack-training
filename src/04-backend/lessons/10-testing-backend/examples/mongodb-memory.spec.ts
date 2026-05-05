// ============================================
// Testing with mongodb-memory-server
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/examples/mongodb-memory.spec.ts
// Install: npm install mongodb-memory-server mongoose

import mongoose, { Schema, model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// --- Schema & Model ---

interface ITask {
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    assignee: String,
    priority: { type: Number, min: 1, max: 5, default: 3 },
  },
  { timestamps: true },
);

taskSchema.index({ status: 1, priority: -1 });
taskSchema.index({ assignee: 1 });

const Task = model<ITask>('Task', taskSchema);

// --- Test setup ---

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// --- Tests ---

describe('Task Model (with in-memory MongoDB)', () => {
  // --- Create ---
  describe('create', () => {
    it('should create a task with default values', async () => {
      const task = await Task.create({ title: 'Write tests' });

      expect(task._id).toBeDefined();
      expect(task.title).toBe('Write tests');
      expect(task.status).toBe('todo');      // default
      expect(task.priority).toBe(3);          // default
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should create a task with all fields', async () => {
      const task = await Task.create({
        title: 'Review PR',
        description: 'Review the auth module PR',
        status: 'in-progress',
        assignee: 'Alice',
        priority: 5,
      });

      expect(task.title).toBe('Review PR');
      expect(task.description).toBe('Review the auth module PR');
      expect(task.status).toBe('in-progress');
      expect(task.assignee).toBe('Alice');
      expect(task.priority).toBe(5);
    });

    it('should fail validation if title is missing', async () => {
      await expect(Task.create({ status: 'todo' } as any)).rejects.toThrow();
    });

    it('should fail validation for invalid status', async () => {
      await expect(
        Task.create({ title: 'Bad', status: 'invalid' as any }),
      ).rejects.toThrow();
    });

    it('should fail validation for priority out of range', async () => {
      await expect(
        Task.create({ title: 'Bad', priority: 10 }),
      ).rejects.toThrow();
    });
  });

  // --- Read ---
  describe('find', () => {
    beforeEach(async () => {
      await Task.insertMany([
        { title: 'Task A', status: 'todo', assignee: 'Alice', priority: 3 },
        { title: 'Task B', status: 'in-progress', assignee: 'Bob', priority: 5 },
        { title: 'Task C', status: 'done', assignee: 'Alice', priority: 1 },
        { title: 'Task D', status: 'todo', assignee: 'Carol', priority: 4 },
        { title: 'Task E', status: 'todo', assignee: 'Alice', priority: 5 },
      ]);
    });

    it('should find all tasks', async () => {
      const tasks = await Task.find();
      expect(tasks).toHaveLength(5);
    });

    it('should find tasks by status', async () => {
      const todos = await Task.find({ status: 'todo' });
      expect(todos).toHaveLength(3);
    });

    it('should find tasks by assignee', async () => {
      const aliceTasks = await Task.find({ assignee: 'Alice' });
      expect(aliceTasks).toHaveLength(3);
    });

    it('should sort by priority descending', async () => {
      const tasks = await Task.find().sort({ priority: -1 });
      expect(tasks[0]!.priority).toBe(5);
      expect(tasks[tasks.length - 1]!.priority).toBe(1);
    });

    it('should paginate with skip and limit', async () => {
      const page1 = await Task.find().sort({ title: 1 }).skip(0).limit(2);
      const page2 = await Task.find().sort({ title: 1 }).skip(2).limit(2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0]!.title).toBe('Task A');
      expect(page2[0]!.title).toBe('Task C');
    });

    it('should count documents', async () => {
      const total = await Task.countDocuments();
      const todoCount = await Task.countDocuments({ status: 'todo' });

      expect(total).toBe(5);
      expect(todoCount).toBe(3);
    });
  });

  // --- Update ---
  describe('update', () => {
    it('should update a task', async () => {
      const task = await Task.create({ title: 'Original', priority: 2 });

      const updated = await Task.findByIdAndUpdate(
        task._id,
        { title: 'Updated', priority: 4 },
        { new: true },
      );

      expect(updated?.title).toBe('Updated');
      expect(updated?.priority).toBe(4);
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = new Types.ObjectId();
      const result = await Task.findByIdAndUpdate(fakeId, { title: 'X' }, { new: true });
      expect(result).toBeNull();
    });
  });

  // --- Delete ---
  describe('delete', () => {
    it('should delete a task', async () => {
      const task = await Task.create({ title: 'To Delete' });

      await Task.findByIdAndDelete(task._id);

      const found = await Task.findById(task._id);
      expect(found).toBeNull();
    });

    it('should handle deleting non-existent task', async () => {
      const fakeId = new Types.ObjectId();
      const result = await Task.findByIdAndDelete(fakeId);
      expect(result).toBeNull();
    });
  });

  // --- Aggregation ---
  describe('aggregation', () => {
    beforeEach(async () => {
      await Task.insertMany([
        { title: 'A', status: 'todo', assignee: 'Alice', priority: 3 },
        { title: 'B', status: 'todo', assignee: 'Bob', priority: 5 },
        { title: 'C', status: 'done', assignee: 'Alice', priority: 1 },
        { title: 'D', status: 'todo', assignee: 'Alice', priority: 4 },
      ]);
    });

    it('should count tasks per status', async () => {
      const result = await Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const todoGroup = result.find((r) => r._id === 'todo');
      expect(todoGroup?.count).toBe(3);

      const doneGroup = result.find((r) => r._id === 'done');
      expect(doneGroup?.count).toBe(1);
    });

    it('should find top assignees', async () => {
      const result = await Task.aggregate([
        { $group: { _id: '$assignee', taskCount: { $sum: 1 } } },
        { $sort: { taskCount: -1 } },
      ]);

      expect(result[0]._id).toBe('Alice');
      expect(result[0].taskCount).toBe(3);
    });
  });
});
