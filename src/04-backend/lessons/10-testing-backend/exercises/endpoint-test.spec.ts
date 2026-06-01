// ============================================
// Exercise: Integration Tests with Supertest
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/exercises/endpoint-test.spec.ts
// Install: npm install supertest @types/supertest fastify

import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest'; // used in TODO implementations below
import { describe, expect, beforeAll, afterAll, it } from '@jest/globals';

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
      const response = await request(app.server)
        .post('/items')
        .send({
          name: 'Test Item',
          description: 'A test item',
          price: 19.99,
          category: 'test',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Test Item',
        description: 'A test item',
        price: 19.99,
        category: 'test',
        inStock: true,
      });
    });

    it('returns 400 when name is missing', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({
          description: 'A test item',
          price: 19.99,
          category: 'test',
        })
        .expect(400);

      expect(response.body.error).toMatch(/name/i);
    });

    it('returns 400 when price is negative', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({
          name: 'Test Item',
          description: 'A test item',
          price: -19.99,
          category: 'test',
        })
        .expect(400);

      expect(response.body.error).toMatch(/non-negative/i);
    });

    it('returns 400 when description is missing', async () => {
      const response = await request(app.server)
        .post('/items')
        .send({
          name: 'Test Item',
          price: 19.99,
          category: 'test',
        })
        .expect(400);

      expect(response.body.error).toMatch(/description/i);
    });

    it('returns 409 when creating an item with a duplicate name', async () => {
      // Create the first item
      await request(app.server)
        .post('/items')
        .send({
          name: 'Test Item a',
          description: 'A test item',
          price: 19.99,
          category: 'test',
        })
        .expect(201);

      const response = await request(app.server)
        .post('/items')
        .send({
          name: 'Test Item a',
          description: 'Another test item',
          price: 29.99,
          category: 'test',
        })
        .expect(409);
      expect(response.body.error).toMatch(/already exists/i);
    });
  });

  // ============================================
  // Group 2: GET /items/:id
  // ============================================
  describe('GET /items/:id', () => {
    it('retrieves an existing item by ID (POST first, then GET by the returned id)', async () => {
      const createdItem = await request(app.server)
        .post('/items')
        .send({ name: 'Item to find', description: 'Find me', price: 10, category: 'test' })
        .expect(201);

      const { id } = createdItem.body;
      const response = await request(app.server).get(`/items/${id}`).expect(200);

      expect(response.body).toMatchObject({
        id,
        name: 'Item to find',
        description: 'Find me',
        price: 10,
        category: 'test',
        inStock: true,
      });
    });

    it('returns 404 for a non-existent ID', async () => {
      const response = await request(app.server).get('/items/999').expect(404);

      expect(response.body.error).toBe('Item not found');
    });
  });

  // ============================================
  // Group 3: GET /items (list with filters and pagination)
  // ============================================
  describe('GET /items', () => {
    it('returns all items with correct pagination meta (data array + meta object)', async () => {
      // Create 15 items in category "test"
      for (let i = 1; i <= 15; i++) {
        await request(app.server)
          .post('/items')
          .send({
            name: `Test Item ${i}`,
            description: `Description for Test Item ${i}`,
            price: 19.99,
            category: 'test',
          })
          .expect(201);
      }

      const response = await request(app.server).get('/items').expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta).toEqual({
        total: 18,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
    });
    it('filters by category (?category=electronics returns only matching items)', async () => {
      for (let i = 1; i <= 10; i++) {
        await request(app.server)
          .post('/items')
          .send({
            name: `Test Item ${i} ${i} ${i}`,
            description: `Description for Test Item ${i}${i}${i}`,
            price: 19.99,
            category: 'test',
          })
          .expect(201);
      }

      for (let i = 1; i <= 5; i++) {
        await request(app.server)
          .post('/items')
          .send({
            name: `Electronics Item ${i}${i}${i}`,
            description: `Description for Electronics Item ${i}${i}${i}`,
            price: 29.99,
            category: 'electronics',
          })
          .expect(201);
      }

      const response = await request(app.server).get('/items?category=electronics').expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0].category).toBe('electronics');
    });
    it('paginates correctly (?page=1&limit=2 — correct data length + meta total/page/limit/totalPages)', async () => {
      // Create 15 items in category "test"
      for (let i = 1; i <= 15; i++) {
        await request(app.server)
          .post('/items')
          .send({
            name: `Tes Item ${i}`,
            description: `Description for Test Item ${i}`,
            price: 19.99,
            category: 'test',
          })
          .expect(201);
      }

      const response = await request(app.server).get('/items?page=1&limit=2').expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toEqual({
        total: 48,
        page: 1,
        limit: 2,
        totalPages: 24,
      });
    });
  });

  // ============================================
  // Group 4: PATCH /items/:id
  // ============================================
  describe('PATCH /items/:id', () => {
    it('partially updates an item (PATCH { name: "New Name" } — name updated, other fields unchanged)', async () => {
      const createdItem = await request(app.server)
        .post('/items')
        .send({ name: 'Item to update', description: 'Update me', price: 10, category: 'test' })
        .expect(201);

      const { id } = createdItem.body;

      const response = await request(app.server)
        .patch(`/items/${id}`)
        .send({ name: 'Updated Item Name' })
        .expect(200);

      expect(response.body).toMatchObject({
        id,
        name: 'Updated Item Name',
        description: 'Update me',
        price: 10,
        category: 'test',
        inStock: true,
      });
    });
    it('returns 400 for invalid price (negative number)', async () => {
      const createdItem = await request(app.server)
        .post('/items')
        .send({ name: 'Item to update', description: 'Update me', price: 10, category: 'test' })
        .expect(201);

      await request(app.server)
        .patch(`/items/${createdItem.body.id}`)
        .send({ price: -5 })
        .expect(400);
    });
    it('returns 404 for non-existent ID', async () => {
      await request(app.server).patch('/items/999').send({ name: 'Non-existent Item' }).expect(404);
    });
  });

  // ============================================
  // Group 5: DELETE /items/:id
  // ============================================
  describe('DELETE /items/:id', () => {
    it('deletes an item and verifies it is gone (DELETE then GET returns 404)', async () => {
      const created = await request(app.server)
        .post('/items')
        .send({ name: 'Item to delete', description: 'Delete me', price: 5, category: 'test' })
        .expect(201);

      const { id } = created.body;
      await request(app.server).delete(`/items/${id}`).expect(204);
      await request(app.server).get(`/items/${id}`).expect(404);
    });

    it('returns 404 for non-existent ID', async () => {
      await request(app.server).delete('/items/999').expect(404);
    });
  });

  // ============================================
  // Group 6: Full CRUD flow
  // ============================================
  describe('Full CRUD flow', () => {
    it('full lifecycle: POST → GET → PATCH price → GET (verify update) → DELETE → GET (404)', async () => {
      const created = await request(app.server)
        .post('/items')
        .send({
          name: 'Lifecycle Item',
          description: 'Full lifecycle',
          price: 10,
          category: 'test',
        })
        .expect(201);

      const { id } = created.body;

      await request(app.server).get(`/items/${id}`).expect(200);

      const patched = await request(app.server)
        .patch(`/items/${id}`)
        .send({ price: 25 })
        .expect(200);
      expect(patched.body.price).toBe(25);

      const fetched = await request(app.server).get(`/items/${id}`).expect(200);
      expect(fetched.body.price).toBe(25);

      await request(app.server).delete(`/items/${id}`).expect(204);
      await request(app.server).get(`/items/${id}`).expect(404);
    });
  });
});
