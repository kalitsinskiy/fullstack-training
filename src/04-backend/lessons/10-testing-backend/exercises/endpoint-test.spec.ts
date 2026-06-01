// ============================================
// Exercise: Integration Tests with Supertest
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/exercises/endpoint-test.spec.ts
// Install: npm install supertest @types/supertest fastify

import Fastify, { FastifyInstance } from 'fastify';
import { afterEach } from 'node:test';
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
    },
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

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
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
      const newItem = {
        name: 'Test Item',
        description: 'A test item for our API',
        price: 19.99,
        category: 'test',
      };

      const response = await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        category: newItem.category,
        inStock: true,
      });
    });
    it('returns 400 when name is missing', async () => {
      const newItem = {
        description: 'A test item for our API',
        price: 19.99,
        category: 'test',
      };

      await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(400);
    });
    it('returns 400 when price is negative', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'A test item for our API',
        price: -19.99,
        category: 'test',
      };

      await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(400);
    });
    it('returns 400 when description is missing', async () => {
      const newItem = {
        name: 'Test Item',
        price: 19.99,
        category: 'test',
      };

      await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(400);
    });
    it('returns 409 when creating an item with a duplicate name (create one first, then try a second with the same name)', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'A test item for our API',
        price: 19.99,
        category: 'test',
      };

      await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(201);

      await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(409);
    });
  });

  // ============================================
  // Group 2: GET /items/:id
  // ============================================
  describe('GET /items/:id', () => {
    it('retrieves an existing item by ID (POST first, then GET by the returned id)', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'A test item for our API',
        price: 19.99,
        category: 'test',
      };

      const postResponse = await request(app.server)
        .post('/items')
        .send(newItem)
        .expect(201);

      const getItemResponse = await request(app.server)
        .get(`/items/${postResponse.body.id}`)
        .expect(200);

      expect(getItemResponse.body).toMatchObject(postResponse.body);
    });
    it('returns 404 for a non-existent ID', async () => {
      await request(app.server)
        .get('/items/non-existent-id')
        .expect(404);
    });
  });

  // ============================================
  // Group 3: GET /items (list with filters and pagination)
  // ============================================
  describe('GET /items', () => {
    it('returns all items with correct pagination meta (data array + meta object)', async () => {
      const items = [
        { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' },
        { name: 'Item 2', description: 'Description 2', price: 29.99, category: 'test' },
      ];

      items.forEach(async (item) => {
        await request(app.server)
          .post('/items')
          .send(item)
          .expect(201);
      });

      const response = await request(app.server)
        .get('/items')
        .expect(200);

      expect(response.body).toMatchObject({
        data: items,
        meta: {
          total: items.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
    it('filters by category (?category=electronics returns only matching items)', async () => {
      const items = [
        { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'electronics' },
        { name: 'Item 2', description: 'Description 2', price: 29.99, category: 'test' },
      ];

      items.forEach(async (item) => {
        await request(app.server)
          .post('/items')
          .send(item)
          .expect(201);
      });

      const response = await request(app.server)
        .get('/items?category=electronics')
        .expect(200);

      expect(response.body.data).toMatchObject([items[0]]);
    });
    it('paginates correctly (?page=1&limit=2 — correct data length + meta total/page/limit/totalPages)', async () => {
      const items = [
        { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' },
        { name: 'Item 2', description: 'Description 2', price: 29.99, category: 'test' },
      ];

      items.forEach(async (item) => {
        await request(app.server)
          .post('/items')
          .send(item)
          .expect(201);
      });

      const response = await request(app.server)
        .get('/items?page=1&limit=2')
        .expect(200);

      expect(response.body).toMatchObject({
        data: items,
        meta: {
          total: items.length,
          page: 1,
          limit: 2,
          totalPages: 1,
        },
      });
    });
  });

  // ============================================
  // Group 4: PATCH /items/:id
  // ============================================
  describe('PATCH /items/:id', () => {
    it('partially updates an item (PATCH { name: "New Name" } — name updated, other fields unchanged)', async () => {
      const item = { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' };
      const updatedItem = { ...item, name: 'New Name' };

      const postResponse = await request(app.server)
        .post('/items')
        .send(item)
        .expect(201);

      const response = await request(app.server)
        .patch(`/items/${postResponse.body.id}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body).toMatchObject(updatedItem);
    });
    it('returns 400 for invalid price (negative number)', async () => {
      const item = { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' };

      const postResponse = await request(app.server)
        .post('/items')
        .send(item)
        .expect(201);

      await request(app.server)
        .patch(`/items/${postResponse.body.id}`)
        .send({ price: -5 })
        .expect(400);
    });
    it('returns 404 for non-existent ID', async () => {
      await request(app.server)
        .patch('/items/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  // ============================================
  // Group 5: DELETE /items/:id
  // ============================================
  describe('DELETE /items/:id', () => {
    it('deletes an item and verifies it is gone (DELETE then GET returns 404)', async () => {
      const item = { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' };

      const postResponse = await request(app.server)
        .post('/items')
        .send(item)
        .expect(201);

      await request(app.server)
        .delete(`/items/${postResponse.body.id}`)
        .expect(204);

      await request(app.server)
        .get(`/items/${postResponse.body.id}`)
        .expect(404);
    });
    it('returns 404 for non-existent ID', async () => {
      await request(app.server)
        .delete('/items/non-existent-id')
        .expect(404);
    });
  });

  // ============================================
  // Group 6: Full CRUD flow
  // ============================================
  describe('Full CRUD flow', () => {
    it('full lifecycle: POST → GET → PATCH price → GET (verify update) → DELETE → GET (404)', async () => {
      const item = { name: 'Item 1', description: 'Description 1', price: 19.99, category: 'test' };

      const postResponse = await request(app.server)
        .post('/items')
        .send(item)
        .expect(201);

      const getResponse = await request(app.server)
        .get(`/items/${postResponse.body.id}`)
        .expect(200);

      const patchResponse = await request(app.server)
        .patch(`/items/${postResponse.body.id}`)
        .send({ price: 29.99 })
        .expect(200);

      const updatedItem = { ...item, price: 29.99 };

      expect(patchResponse.body).toMatchObject(updatedItem);

      await request(app.server)
        .delete(`/items/${postResponse.body.id}`)
        .expect(204);

      await request(app.server)
        .get(`/items/${postResponse.body.id}`)
        .expect(404);
    });
  });
});
