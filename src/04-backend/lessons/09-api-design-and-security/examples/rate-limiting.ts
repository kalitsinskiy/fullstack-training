// ============================================
// Rate Limiting
// ============================================
// This file demonstrates rate limiting concepts and NestJS setup.
// Run: npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/rate-limiting.ts

// --- 1. Simple in-memory rate limiter ---
// This demonstrates the concept. In production, use @nestjs/throttler or a Redis-backed solution.

class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,  // time window in milliseconds
    private readonly maxRequests: number, // max requests per window
  ) {}

  /**
   * Check if a request from the given key (IP, user ID, etc.) is allowed.
   * Returns { allowed, remaining, resetMs }.
   */
  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps, filter to current window
    const timestamps = (this.requests.get(key) || []).filter((t) => t > windowStart);

    const allowed = timestamps.length < this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - timestamps.length - (allowed ? 1 : 0));

    if (allowed) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
    }

    // Time until the oldest request in the window expires
    const resetMs = timestamps.length > 0 ? timestamps[0]! + this.windowMs - now : 0;

    return { allowed, remaining, resetMs };
  }

  /** Cleanup old entries */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests) {
      const filtered = timestamps.filter((t) => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

// --- 2. Token Bucket algorithm ---

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,    // bucket capacity
    private readonly refillRate: number,    // tokens added per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  consume(count: number = 1): boolean {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// --- 3. Demo ---

function main(): void {
  console.log('=== Rate Limiting Examples ===\n');

  // Sliding window rate limiter
  console.log('--- Sliding Window Rate Limiter ---');
  const limiter = new RateLimiter(5000, 3); // 3 requests per 5 seconds

  for (let i = 1; i <= 5; i++) {
    const result = limiter.check('user-1');
    console.log(
      `Request ${i}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}, ` +
      `remaining: ${result.remaining}, ` +
      `reset in: ${result.resetMs}ms`,
    );
  }

  // Token bucket
  console.log('\n--- Token Bucket ---');
  const bucket = new TokenBucket(5, 1); // 5 max tokens, 1 token/second refill

  for (let i = 1; i <= 7; i++) {
    const allowed = bucket.consume();
    console.log(`Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}, tokens: ${bucket.getTokens()}`);
  }

  console.log('\n--- NestJS @nestjs/throttler Setup (reference) ---');
  console.log(`
// 1. Install:
//    npm install @nestjs/throttler

// 2. Import in AppModule:
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 1 minute
      limit: 100,    // 100 requests per minute (global default)
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,    // APP_GUARD comes from @nestjs/core
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// 3. Custom limits per route:
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 per minute for login
  login(@Body() dto: LoginDto) { ... }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })  // 3 per minute for register
  register(@Body() dto: RegisterDto) { ... }
}

@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle()  // no rate limiting on health check
  check() { return { status: 'ok' }; }
}

// 4. Response headers (set automatically by ThrottlerGuard):
//    X-RateLimit-Limit: 100
//    X-RateLimit-Remaining: 99
//    X-RateLimit-Reset: 1700000060
//    Retry-After: 45  (only when blocked)
  `);

  console.log('Done.');
}

main();

export {};
