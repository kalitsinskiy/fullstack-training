export {};
// ============================================
// BASIC CONTROLLER Example
// ============================================
//
// ⚠️  NestJS examples must run from the santa-api/ directory (which has the
//     correct tsconfig and NestJS dependencies). The runnable copy lives at:
//     santa-api/examples/04-nestjs-fundamentals/basic-controller.ts
//
// Run:  cd santa-api && npx ts-node examples/04-nestjs-fundamentals/basic-controller.ts
//
// This example creates a minimal NestJS app with a single controller
// that handles GET and POST requests for a "books" resource.

import 'reflect-metadata';
import { Controller, Get, Post, Param, Body, Module, HttpCode, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// ---- Entity type ----

interface Book {
  id: string;
  title: string;
  author: string;
}

// ---- Controller ----
// The @Controller('books') decorator prefixes all routes with /books.
// Each method decorator (@Get, @Post) maps an HTTP method to a handler.

@Controller('books')
class BooksController {
  private books: Book[] = [
    { id: '1', title: '1984', author: 'George Orwell' },
    { id: '2', title: 'Dune', author: 'Frank Herbert' },
  ];

  // GET /books — return all books
  @Get()
  findAll(): Book[] {
    console.log('GET /books');
    return this.books;
  }

  // GET /books/:id — return one book by id
  // NotFoundException automatically returns 404 with { message, error, statusCode }
  @Get(':id')
  findOne(@Param('id') id: string): Book {
    console.log(`GET /books/${id}`);
    const book = this.books.find(b => b.id === id);
    if (!book) {
      throw new NotFoundException(`Book with id "${id}" not found`);
    }
    return book;
  }

  // POST /books — create a new book
  // NestJS returns 201 for @Post by default
  @Post()
  create(@Body() body: { title: string; author: string }): Book {
    console.log('POST /books', body);
    const book: Book = {
      id: String(this.books.length + 1),
      title: body.title,
      author: body.author,
    };
    this.books.push(book);
    return book;
  }

  // POST /books/reset — reset the list (demonstrating @HttpCode)
  @Post('reset')
  @HttpCode(204) // No Content
  reset(): void {
    console.log('POST /books/reset');
    this.books = [];
  }
}

// ---- Module ----

@Module({
  controllers: [BooksController],
})
class AppModule {}

// ---- Bootstrap ----

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['warn', 'error'] }, // quiet startup logs
  );

  await app.listen(3000, '0.0.0.0');
  console.log('NestJS + Fastify running on http://localhost:3000');
  console.log('Try:');
  console.log('  curl http://localhost:3000/books');
  console.log('  curl http://localhost:3000/books/1');
  console.log('  curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -d \'{"title":"Neuromancer","author":"William Gibson"}\'');
  console.log('\nPress Ctrl+C to stop.\n');
}

bootstrap();
