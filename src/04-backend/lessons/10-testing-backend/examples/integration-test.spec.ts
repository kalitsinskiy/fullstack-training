// ============================================
// Integration Testing with Supertest
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/examples/integration-test.spec.ts
// Install: npm install supertest @types/supertest fastify

import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';

// --- Build a simple Fastify app for testing ---

interface Item {
  id: string;
  name: string;
  price: number;
}

function buildApp(): FastifyInstance {
  const app = Fastify();
  const items: Item[] = [];
  let nextId = 1;

  // Create item
  app.post<{ Body: { name: string; price: number } }>('/items', async (req, reply) => {
    const { name, price } = req.body;

    if (!name || typeof name !== 'string') {
      return reply.status(400).send({ error: 'Name is required' });
    }
    if (price == null || typeof price !== 'number' || price < 0) {
      return reply.status(400).send({ error: 'Price must be a non-negative number' });
    }

    const item: Item = { id: String(nextId++), name, price };
    items.push(item);

    return reply.status(201).send(item);
  });

  // List items
  app.get('/items', async (_req, reply) => {
    return reply.send({ data: items, total: items.length });
  });

  // Get item by ID
  app.get<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    const item = items.find((i) => i.id === req.params.id);
    if (!item) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    return reply.send(item);
  });

  // Update item
  app.put<{ Params: { id: string }; Body: Partial<Item> }>('/items/:id', async (req, reply) => {
    const index = items.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    const existing = items[index]!;
    items[index] = { ...existing, ...req.body, id: existing.id };
    return reply.send(items[index]);
  });

  // Delete item
  app.delete<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    const index = items.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    items.splice(index, 1);
    return reply.status(204).send();
  });

  return app;
}

// --- Tests ---

describe('Items API (Integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- POST /items ---
  describe('POST /items', () => {
    it('should create a new item', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({ name: 'Widget', price: 9.99 })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Widget',
        price: 9.99,
      });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({ price: 9.99 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if price is negative', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({ name: 'Bad Item', price: -5 })
        .expect(400);

      expect(response.body.error).toContain('non-negative');
    });
  });

  // --- GET /items ---
  describe('GET /items', () => {
    it('should return all items', async () => {
      const response = await request(app.server)
        .get('/items')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });
  });

  // --- GET /items/:id ---
  describe('GET /items/:id', () => {
    it('should return an item by ID', async () => {
      // Create an item first
      const createRes = await request(app.server)
        .post('/items')
        .send({ name: 'Findable Item', price: 19.99 });

      const id = createRes.body.id;

      const response = await request(app.server)
        .get(`/items/${id}`)
        .expect(200);

      expect(response.body.name).toBe('Findable Item');
      expect(response.body.price).toBe(19.99);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app.server)
        .get('/items/999')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });
  });

  // --- PUT /items/:id ---
  describe('PUT /items/:id', () => {
    it('should update an existing item', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({ name: 'Old Name', price: 5.00 });

      const id = createRes.body.id;

      const response = await request(app.server)
        .put(`/items/${id}`)
        .send({ name: 'New Name', price: 7.50 })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.price).toBe(7.50);
      expect(response.body.id).toBe(id); // ID should not change
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.server)
        .put('/items/999')
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  // --- DELETE /items/:id ---
  describe('DELETE /items/:id', () => {
    it('should delete an existing item', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({ name: 'Deletable', price: 1.00 });

      const id = createRes.body.id;

      await request(app.server)
        .delete(`/items/${id}`)
        .expect(204);

      // Verify it's gone
      await request(app.server)
        .get(`/items/${id}`)
        .expect(404);
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.server)
        .delete('/items/999')
        .expect(404);
    });
  });

  // --- Full flow test ---
  describe('Full CRUD flow', () => {
    it('should create, read, update, and delete an item', async () => {
      // Create
      const createRes = await request(app.server)
        .post('/items')
        .send({ name: 'Flow Item', price: 10.00 })
        .expect(201);

      const id = createRes.body.id;

      // Read
      const readRes = await request(app.server)
        .get(`/items/${id}`)
        .expect(200);
      expect(readRes.body.name).toBe('Flow Item');

      // Update
      const updateRes = await request(app.server)
        .put(`/items/${id}`)
        .send({ name: 'Updated Flow Item' })
        .expect(200);
      expect(updateRes.body.name).toBe('Updated Flow Item');

      // Delete
      await request(app.server)
        .delete(`/items/${id}`)
        .expect(204);

      // Verify deleted
      await request(app.server)
        .get(`/items/${id}`)
        .expect(404);
    });
  });
});
