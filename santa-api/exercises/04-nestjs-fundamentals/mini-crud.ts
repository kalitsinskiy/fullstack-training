export {};
// ============================================
// MINI CRUD Exercise
// ============================================
// ⚠️  Run from santa-api/:  cd santa-api && npx ts-node exercises/04-nestjs-fundamentals/mini-crud.ts
//
// Build a complete CRUD API for a "products" resource using NestJS.
//
// Requirements:
// - ProductsService with in-memory Map<string, Product> storage
// - ProductsController with all CRUD endpoints
// - ProductsModule wiring it all together
// - AppModule importing ProductsModule
// - Fastify adapter, port 3000
//
// Test your solution:
//   curl http://localhost:3000/products                                          # GET all
//   curl -X POST http://localhost:3000/products -H "Content-Type: application/json" -d '{"name":"Laptop","price":999,"category":"electronics"}'
//   curl http://localhost:3000/products/<id>                                     # GET one
//   curl -X PUT http://localhost:3000/products/<id> -H "Content-Type: application/json" -d '{"name":"Laptop Pro","price":1299}'
//   curl -X DELETE http://localhost:3000/products/<id>                           # DELETE

import 'reflect-metadata';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Module,
  Injectable,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

// ---- Types ----

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductDto {
  name: string;
  price: number;
  category: string;
}

interface UpdateProductDto {
  name?: string;
  price?: number;
  category?: string;
}

// ---- Service ----

// TODO 1: Create a ProductsService class
// - Decorate it with @Injectable()
// - Use a private Map<string, Product> for storage
// - Implement these methods:
//   findAll(): Product[]                           — return all products as array
//   findOne(id: string): Product                   — return product or throw NotFoundException
//     Hint: `throw new NotFoundException('Product not found')` — NestJS built-in exception,
//     automatically returns 404 with { message, error, statusCode } JSON. Already imported above.
//   create(dto: CreateProductDto): Product          — generate id with crypto.randomUUID(), set createdAt/updatedAt
//   update(id: string, dto: UpdateProductDto): Product — find existing or throw 404, merge fields, update updatedAt
//   remove(id: string): void                        — find existing or throw 404, delete from map

@Injectable()
class ProductsService {
  private readonly products = new Map<string, Product>();

  findAll(): Product[] {
    return Array.from(this.products.values());
  }

  findOne(id: string): Product {
    const product = this.products.get(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  create(dto: CreateProductDto): Product {
    const now = new Date();
    const product: Product = {
      id: crypto.randomUUID(),
      name: dto.name,
      price: dto.price,
      category: dto.category,
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(product.id, product);
    return product;
  }

  update(id: string, dto: UpdateProductDto): Product {
    const existingProduct = this.findOne(id);
    const updatedProduct: Product = {
      ...existingProduct,
      ...dto,
      updatedAt: new Date(),
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  remove(id: string): void {
    this.findOne(id);
    this.products.delete(id);
  }
}

// ---- Controller ----

// TODO 2: Create a ProductsController class
// - Decorate with @Controller('products')
// - Inject ProductsService via constructor
// - Implement these route handlers:
//   @Get()         findAll()              — return all products (200)
//   @Get(':id')    findOne(@Param)        — return one product (200) or 404
//   @Post()        create(@Body)          — create product (201 — default for @Post)
//   @Put(':id')    update(@Param, @Body)  — update product (200) or 404
//   @Delete(':id') remove(@Param)         — delete product, return 204 (use @HttpCode)

@Controller('products')
class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Product[] {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Product {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateProductDto): Product {
    return this.productsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto): Product {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.productsService.remove(id);
  }
}

// ---- Module ----

// TODO 3: Create a ProductsModule
// - Register ProductsController in controllers
// - Register ProductsService in providers

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
class ProductsModule {}

// ---- App Module ----

// TODO 4: Create an AppModule
// - Import ProductsModule

@Module({
  imports: [ProductsModule],
})
class AppModule {}

// ---- Bootstrap ----

// TODO 5: Create the bootstrap function
// - Use NestFactory.create with FastifyAdapter
// - Listen on port 3000
// - Log the URL to console

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['warn', 'error'],
    },
  );

  await app.listen(3000, '0.0.0.0');
  console.log('Mini CRUD API running on http://localhost:3000');
}

bootstrap();
