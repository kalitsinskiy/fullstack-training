// ============================================
// Exercise: Integration Tests with Supertest
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/exercises/endpoint-test.spec.ts
// Install: npm install supertest @types/supertest fastify

import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest'; // used in TODO implementations below

// --- App to test (given to you — do not modify) ---

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}

function buildApp(): FastifyInstance {
  const app = Fastify();
  const items: Item[] = [];
  let nextId = 1;

  // POST /items — create a new item
  app.post<{ Body: Partial<Item> }>('/items', async (req, reply) => {
    const { name, description, price, category } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return reply.status(400).send({ error: 'Name is required and must be a non-empty string' });
    }
    if (!description || typeof description !== 'string') {
      return reply.status(400).send({ error: 'Description is required' });
    }
    if (price == null || typeof price !== 'number' || price < 0) {
      return reply.status(400).send({ error: 'Price must be a non-negative number' });
    }
    if (!category || typeof category !== 'string') {
      return reply.status(400).send({ error: 'Category is required' });
    }

    // Check for duplicate name
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      return reply.status(409).send({ error: 'Item with this name already exists' });
    }

    const item: Item = {
      id: String(nextId++),
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      inStock: true,
    };
    items.push(item);

    return reply.status(201).send(item);
  });

  // GET /items — list items with optional filters
  app.get<{ Querystring: { category?: string; inStock?: string; page?: string; limit?: string } }>(
    '/items',
    async (req, reply) => {
      let filtered = [...items];

      if (req.query.category) {
        filtered = filtered.filter((i) => i.category === req.query.category);
      }
      if (req.query.inStock !== undefined) {
        const inStock = req.query.inStock === 'true';
        filtered = filtered.filter((i) => i.inStock === inStock);
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;
      const data = filtered.slice(skip, skip + limit);

      return reply.send({
        data,
        meta: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      });
    }
  );

  // GET /items/:id — get item by ID
  app.get<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    const item = items.find((i) => i.id === req.params.id);
    if (!item) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    return reply.send(item);
  });

  // PATCH /items/:id — partial update
  app.patch<{ Params: { id: string }; Body: Partial<Item> }>('/items/:id', async (req, reply) => {
    const index = items.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Item not found' });
    }

    const { name, description, price, inStock } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return reply.status(400).send({ error: 'Name must be a non-empty string' });
    }
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return reply.status(400).send({ error: 'Price must be a non-negative number' });
    }

    const existing = items[index]!;
    items[index] = {
      ...existing,
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(inStock !== undefined && { inStock }),
    };

    return reply.send(items[index]);
  });

  // DELETE /items/:id
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

// --- Your tests ---

describe('Items API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // Each `it.todo(...)` shows up in jest output as a pending test.
  // Replace each one with a real `it('...', async () => { ... })` as you go.
  // Use `request(app.server)` to make HTTP calls.

  // ============================================
  // Group 1: POST /items
  // ============================================
  describe('POST /items', () => {
    it('creates an item successfully with status 201; body has id, name, description, price, category, inStock: true', async () => {
      const res = await request(app.server)
        .post('/items')
        .send({
          name: 'Widget Alpha',
          description: 'A fine widget',
          price: 9.99,
          category: 'tools',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: 'Widget Alpha',
        description: 'A fine widget',
        price: 9.99,
        category: 'tools',
        inStock: true,
      });
    });
    it('returns 400 when name is missing', async () => {
      const res = await request(app.server)
        .post('/items')
        .send({ description: 'No name', price: 5, category: 'misc' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when price is negative', async () => {
      const res = await request(app.server)
        .post('/items')
        .send({
          name: 'Negative Price Item',
          description: 'Bad price',
          price: -1,
          category: 'misc',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 400 when description is missing', async () => {
      const res = await request(app.server)
        .post('/items')
        .send({ name: 'No Description Item', price: 5, category: 'misc' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 409 when creating an item with a duplicate name (create one first, then try a second with the same name)', async () => {
      await request(app.server)
        .post('/items')
        .send({ name: 'Duplicate Item', description: 'First one', price: 10, category: 'test' });

      const res = await request(app.server)
        .post('/items')
        .send({ name: 'Duplicate Item', description: 'Second one', price: 10, category: 'test' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ============================================
  // Group 2: GET /items/:id
  // ============================================
  describe('GET /items/:id', () => {
    it('retrieves an existing item by ID (POST first, then GET by the returned id)', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({
          name: 'Get By ID Item',
          description: 'Fetchable item',
          price: 15,
          category: 'fetch',
        });

      const { id } = createRes.body;

      const res = await request(app.server).get(`/items/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.name).toBe('Get By ID Item');
    });
    it('returns 404 for a non-existent ID', async () => {
      const res = await request(app.server).get('/items/nonexistent-9999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ============================================
  // Group 3: GET /items (list with filters and pagination)
  // ============================================
  describe('GET /items', () => {
    it('returns all items with correct pagination meta (data array + meta object)', async () => {
      const res = await request(app.server).get('/items');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
    it('filters by category (?category=electronics returns only matching items)', async () => {
      await request(app.server)
        .post('/items')
        .send({
          name: 'Electronics Item A',
          description: 'Gadget',
          price: 99,
          category: 'electronics',
        });
      await request(app.server)
        .post('/items')
        .send({
          name: 'Electronics Item B',
          description: 'Another gadget',
          price: 49,
          category: 'electronics',
        });
      await request(app.server)
        .post('/items')
        .send({
          name: 'Non-Electronics Item',
          description: 'Not a gadget',
          price: 5,
          category: 'books',
        });

      const res = await request(app.server).get('/items?category=electronics');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((item: Item) => item.category === 'electronics')).toBe(true);
    });
    it('paginates correctly (?page=1&limit=2 — correct data length + meta total/page/limit/totalPages)', async () => {
      await request(app.server)
        .post('/items')
        .send({
          name: 'Pagination Item 1',
          description: 'p1',
          price: 1,
          category: 'pagination-test',
        });
      await request(app.server)
        .post('/items')
        .send({
          name: 'Pagination Item 2',
          description: 'p2',
          price: 2,
          category: 'pagination-test',
        });
      await request(app.server)
        .post('/items')
        .send({
          name: 'Pagination Item 3',
          description: 'p3',
          price: 3,
          category: 'pagination-test',
        });

      const res = await request(app.server).get('/items?category=pagination-test&page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });
  });

  // ============================================
  // Group 4: PATCH /items/:id
  // ============================================
  describe('PATCH /items/:id', () => {
    it('partially updates an item (PATCH { name: "New Name" } — name updated, other fields unchanged)', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({
          name: 'Patch Test Item',
          description: 'Original description',
          price: 25,
          category: 'patchable',
        });

      const { id, description, price, category } = createRes.body;

      const res = await request(app.server)
        .patch(`/items/${id}`)
        .send({ name: 'Updated Patch Item' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Patch Item');
      expect(res.body.description).toBe(description);
      expect(res.body.price).toBe(price);
      expect(res.body.category).toBe(category);
    });
    it('returns 400 for invalid price (negative number)', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({ name: 'Patch Price Item', description: 'desc', price: 10, category: 'test' });

      const { id } = createRes.body;

      const res = await request(app.server).patch(`/items/${id}`).send({ price: -5 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.server)
        .patch('/items/nonexistent-9999')
        .send({ name: 'Whatever' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ============================================
  // Group 5: DELETE /items/:id
  // ============================================
  describe('DELETE /items/:id', () => {
    it('deletes an item and verifies it is gone (DELETE then GET returns 404)', async () => {
      const createRes = await request(app.server)
        .post('/items')
        .send({
          name: 'Delete Me Item',
          description: 'Temporary',
          price: 1,
          category: 'disposable',
        });

      const { id } = createRes.body;

      const deleteRes = await request(app.server).delete(`/items/${id}`);
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app.server).get(`/items/${id}`);
      expect(getRes.status).toBe(404);
    });
    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.server).delete('/items/nonexistent-9999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ============================================
  // Group 6: Full CRUD flow
  // ============================================
  describe('Full CRUD flow', () => {
    it('full lifecycle: POST → GET → PATCH price → GET (verify update) → DELETE → GET (404)', async () => {
      // POST
      const createRes = await request(app.server)
        .post('/items')
        .send({
          name: 'Lifecycle Item',
          description: 'Full lifecycle test',
          price: 50,
          category: 'lifecycle',
        });
      expect(createRes.status).toBe(201);
      const { id } = createRes.body;

      // GET
      const getRes = await request(app.server).get(`/items/${id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.price).toBe(50);

      // PATCH price
      const patchRes = await request(app.server).patch(`/items/${id}`).send({ price: 75 });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.price).toBe(75);

      // GET to verify update
      const getUpdatedRes = await request(app.server).get(`/items/${id}`);
      expect(getUpdatedRes.status).toBe(200);
      expect(getUpdatedRes.body.price).toBe(75);

      // DELETE
      const deleteRes = await request(app.server).delete(`/items/${id}`);
      expect(deleteRes.status).toBe(204);

      // GET → 404
      const getDeletedRes = await request(app.server).get(`/items/${id}`);
      expect(getDeletedRes.status).toBe(404);
    });
  });
});
