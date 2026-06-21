# Lesson 05: Redis

## Quick Overview

Redis is an in-memory data store that is exceptionally fast (sub-millisecond reads). While MongoDB is your primary database, Redis complements it by handling patterns where speed and TTL (time-to-live) matter: caching frequently accessed data, expiring invite codes, rate limiting API endpoints, and tracking online users.

By the end of this lesson you will have:

- Redis running in Docker alongside your other services
- A Redis service in santa-api with cache-aside caching for room details
- Invite codes stored in Redis with automatic 48-hour expiration
- Redis-based rate limiting for authentication endpoints
- Online user tracking in santa-notifications using Redis sets

---

## Key Concepts

### 1. What is Redis?

Redis (**Re**mote **Di**ctionary **S**erver) is an in-memory key-value store. Data lives in RAM, making reads and writes extremely fast compared to disk-based databases. Redis is commonly used as:

- **Cache** -- reduce load on the primary database
- **Session store** -- fast session lookups
- **Rate limiter** -- count requests per time window
- **Message broker** -- pub/sub or stream-based messaging
- **Temporary storage** -- data with automatic expiration

Redis is **single-threaded** for command execution, which means operations are atomic by default -- no two commands interfere with each other.

### 2. Key Data Structures

Redis is not just a key-value store for strings. It supports rich data structures:

| Structure | Description | Example Use Case |
|-----------|-------------|-----------------|
| **String** | Simple key-value. Can store text, numbers, or serialized JSON. | Cache a room's JSON, store a counter |
| **Hash** | A map of field-value pairs under one key. | Store user profile fields without serializing |
| **List** | Ordered collection (linked list). Push/pop from both ends. | Recent activity log, job queue |
| **Set** | Unordered collection of unique strings. | Track online users, tags |
| **Sorted Set** | Set with a score per element. Ordered by score. | Leaderboards, rate limiting with timestamps |

```
# Strings
SET room:123 '{"name":"Office Party","status":"open"}'
GET room:123

# Hash
HSET user:456 name "Alice" email "alice@test.com"
HGET user:456 name
HGETALL user:456

# Set
SADD online:users user:123 user:456 user:789
SMEMBERS online:users
SREM online:users user:456

# Sorted Set
ZADD rate:login:192.168.1.1 1713364800 "req1"
ZRANGEBYSCORE rate:login:192.168.1.1 1713361200 +inf
```

### 3. TTL and Expiration

Every key in Redis can have a **time-to-live (TTL)**. When the TTL expires, Redis automatically deletes the key. This is perfect for caches and temporary data.

```
SET invite:abc123 '{"roomId":"...","createdBy":"..."}' EX 172800
# Key expires after 172800 seconds (48 hours)

TTL invite:abc123
# Returns remaining seconds until expiry

EXPIRE invite:abc123 3600
# Reset TTL to 1 hour
```

In Node.js with ioredis:

```typescript
// Set with TTL (in seconds)
await redis.set('invite:abc123', JSON.stringify(data), 'EX', 172800);

// Check remaining TTL
const ttl = await redis.ttl('invite:abc123');

// Delete manually
await redis.del('invite:abc123');
```

### 4. Caching Strategies

**Cache-Aside (Lazy Loading)** -- the most common caching pattern:

```
1. App receives request for room:123
2. Check Redis: GET room:123
3. Cache HIT?  -> Return cached data
4. Cache MISS? -> Query MongoDB, store result in Redis with TTL, return data
```

```typescript
async getRoom(roomId: string): Promise<Room> {
  const cacheKey = `room:${roomId}`;

  // 1. Check cache
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss -- query database
  const room = await this.roomModel.findById(roomId);
  if (!room) throw new NotFoundException('Room not found');

  // 3. Store in cache with 5-minute TTL
  await this.redis.set(cacheKey, JSON.stringify(room), 'EX', 300);

  return room;
}
```

**Write-Through** -- write to cache and database at the same time:

```typescript
async updateRoom(roomId: string, data: UpdateRoomDto): Promise<Room> {
  const room = await this.roomModel.findByIdAndUpdate(roomId, data, { new: true });

  // Update cache immediately
  await this.redis.set(`room:${roomId}`, JSON.stringify(room), 'EX', 300);

  return room;
}
```

### 5. Cache Invalidation

When data changes, the cache must be invalidated (deleted or updated). Otherwise, stale data is served.

```typescript
async updateRoom(roomId: string, data: UpdateRoomDto): Promise<Room> {
  const room = await this.roomModel.findByIdAndUpdate(roomId, data, { new: true });

  // Invalidate the cache -- next read will fetch fresh data
  await this.redis.del(`room:${roomId}`);

  return room;
}
```

> "There are only two hard things in Computer Science: cache invalidation and naming things." -- Phil Karlton

Strategies for invalidation:
- **Delete on write**: simplest, safest. Delete the cache key when the source data changes.
- **TTL as safety net**: even if you forget to invalidate, the TTL ensures data refreshes eventually.
- **Write-through**: update cache and DB together. Keeps cache always fresh but adds complexity.

### 6. Redis in Node.js with ioredis

[ioredis](https://github.com/redis/ioredis) is the most popular Redis client for Node.js:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost', // or 'redis' in Docker
  port: 6379,
});

// String operations
await redis.set('key', 'value');
const val = await redis.get('key');

// Set operations
await redis.sadd('online:users', 'user123');
await redis.srem('online:users', 'user123');
const members = await redis.smembers('online:users');

// Check if key exists
const exists = await redis.exists('key');

// Delete
await redis.del('key');

// Graceful shutdown
await redis.quit();
```

### 7. Rate Limiting with Redis

A sliding window rate limiter using sorted sets:

```typescript
async isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Remove old entries outside the window
  await this.redis.zremrangebyscore(key, 0, windowStart);

  // Count remaining entries in the window
  const count = await this.redis.zcard(key);

  if (count >= limit) {
    return true; // Rate limited
  }

  // Add the current request
  await this.redis.zadd(key, now, `${now}-${Math.random()}`);

  // Set expiration on the key itself (cleanup)
  await this.redis.expire(key, windowSeconds);

  return false;
}
```

A simpler approach using a counter with TTL:

```typescript
async isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const current = await this.redis.incr(key);

  if (current === 1) {
    // First request in this window -- set TTL
    await this.redis.expire(key, windowSeconds);
  }

  return current > limit;
}
```

### 8. Redis CLI Basics

> Prefer a GUI? [Medis](https://getmedis.com/) or
> [RedisInsight](https://redis.io/insight/) connect to `localhost:6379` and let
> you browse keys, watch TTLs tick down, and run `MONITOR` visually — handy for
> watching the cache populate and invalidate.

Useful commands for debugging:

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Inside redis-cli:
KEYS *                          # List all keys (use sparingly in production!)
GET room:123                    # Get a string value
TTL room:123                    # Check TTL
SMEMBERS online:users           # List set members
TYPE some-key                   # Check key type
INFO memory                     # Memory usage info
FLUSHALL                        # Delete everything (careful!)
```

---

## Task

### Step 1: Add Redis to docker-compose.yml

Update `docker-compose.yml` to include a Redis service:

```yaml
redis:
  image: redis:8-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
```

Add `redis-data` to the volumes section. The `--appendonly yes` flag enables persistence so data survives container restarts.

Update `santa-api` and `santa-notifications` services to depend on Redis:

```yaml
santa-api:
  depends_on:
    mongo:
      condition: service_healthy
    redis:
      condition: service_healthy
  environment:
    - REDIS_URL=redis://redis:6379
```

### Step 2: Create a RedisService in santa-api

1. Install ioredis:
   ```bash
   cd santa-api && npm install ioredis
   ```

2. Create a `RedisModule` and `RedisService` that:
   - Connects to Redis using the `REDIS_URL` environment variable
   - Provides `get`, `set`, `del`, and other methods as needed
   - Handles graceful shutdown (close connection on app termination)
   - Logs connection status

3. Add `REDIS_URL` to your config validation schema. Give it a **default**
   (`Joi.string().default('redis://localhost:6379')`) rather than `.required()` —
   a required value with no default breaks tests and local runs that don't set it
   (same trap as `NODE_ENV` in Lesson 02).

```typescript
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis(this.configService.get('REDIS_URL'));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
```

### Step 3: Cache room details (cache-aside)

Update your room-fetching logic to use cache-aside:

1. When fetching a room by ID, first check Redis for key `room:{id}`.
2. On cache hit, parse the JSON and return it (skip the database query).
3. On cache miss, query MongoDB, store the result in Redis with a **5-minute TTL**, and return it.
4. Log cache hits and misses for debugging (e.g., `logger.debug('Room cache HIT: room:123')`).

> ⚠️ Cache only the **caller-agnostic** room data. If your room response includes
> per-caller fields (e.g. `viewerPermissions` from Lesson 04), do NOT cache those
> — cache the shared shape under `room:{id}` and compute the per-caller bits after
> the cache lookup, or every viewer will get the first viewer's permissions.
>
> ⚠️ Cache-aside puts Redis on the read path, so your tests now need a reachable
> Redis (point `REDIS_URL` at one, or override/mock `RedisService` in tests).

### Step 4: Invalidate cache on room updates

When a room is updated (name change, participant joins/leaves, draw happens), invalidate the cache:

```typescript
await this.redisService.del(`room:${roomId}`);
```

This ensures the next read fetches fresh data from MongoDB.

### Step 5: Store invite codes in Redis with TTL

Instead of storing invite codes in MongoDB (where they would need a background job to clean up expired ones), store them in Redis with automatic expiration:

1. When creating an invite code for a room, store it in Redis:
   ```typescript
   // Key: invite:{code}  Value: roomId  TTL: 48 hours
   await this.redisService.set(
     `invite:${code}`,
     roomId,
     48 * 60 * 60  // 172800 seconds
   );
   ```

2. When a user tries to join via invite code, look it up in Redis:
   ```typescript
   const roomId = await this.redisService.get(`invite:${code}`);
   if (!roomId) {
     throw new BadRequestException('Invalid or expired invite code');
   }
   ```

3. Optionally, delete the invite code after use (single-use) or leave it until TTL expires (multi-use).

### Step 6: Redis-based rate limiting for auth endpoints

> ℹ️ The template **already** rate-limits auth via `@nestjs/throttler` `@Throttle`
> decorators (login 5/min, register 3/min) — that's the 429 you may have already
> hit. So you do NOT need a second custom guard (it would be redundant and, at
> equal limits, never even fire). The real Redis upgrade is to back the **existing
> throttler with Redis storage** so limits are shared across API instances:
>
> ```ts
> // npm i @nest-lab/throttler-storage-redis ioredis
> ThrottlerModule.forRootAsync({
>   inject: [ConfigService],
>   useFactory: (c: ConfigService) => ({
>     throttlers: [{ ttl: 60_000, limit: 100 }],
>     storage: new ThrottlerStorageRedisService(c.getOrThrow('REDIS_URL')),
>   }),
> });
> ```
>
> ⚠️ Disable the Redis storage under `NODE_ENV=test` — otherwise counters persist
> in Redis across the per-test app instances and trip the limit mid-suite (keep
> the default in-memory storage for tests).

If you'd rather build a limiter from scratch (the manual approach below), do it
INSTEAD of the throttler, not on top of it:

1. Create a `RateLimiterService` (or add methods to `RedisService`) that:
   - Takes a key (e.g., `ratelimit:login:{ip}`), a limit (e.g., 5), and a window (e.g., 60 seconds)
   - Returns whether the request should be blocked

2. Create a NestJS guard or middleware that applies rate limiting:
   ```typescript
   @Injectable()
   export class RateLimitGuard implements CanActivate {
     constructor(private redisService: RedisService) {}

     async canActivate(context: ExecutionContext): Promise<boolean> {
       const request = context.switchToHttp().getRequest();
       const ip = request.ip;
       const key = `ratelimit:login:${ip}`;

       const isLimited = await this.redisService.isRateLimited(key, 5, 60);
       if (isLimited) {
         throw new HttpException('Too many requests', 429);
       }

       return true;
     }
   }
   ```

3. Apply the guard to `POST /auth/login` and `POST /auth/register`.

### Step 7: Track online users in santa-notifications

In **santa-notifications**, use a Redis set to track which users are currently connected via WebSocket (you will implement WebSocket in a later lesson, but prepare the Redis part now):

1. Install ioredis in santa-notifications:
   ```bash
   cd santa-notifications && npm install ioredis
   ```

2. Create functions to manage the online users set:
   ```typescript
   // When a user connects
   await redis.sadd('online:users', userId);

   // When a user disconnects
   await redis.srem('online:users', userId);

   // Check if a user is online
   const isOnline = await redis.sismember('online:users', userId);

   // Get all online users
   const onlineUsers = await redis.smembers('online:users');

   // Count online users
   const count = await redis.scard('online:users');
   ```

3. Create an endpoint `GET /users/online` that returns the list of currently online users.

---

## Verification

```bash
# 1. Start the stack
docker-compose up --build

# 2. Verify Redis is running
docker-compose exec redis redis-cli PING
# Expected: PONG

# 3. Test room caching
# Fetch a room (first call = cache miss, hits DB)
curl http://localhost:3001/rooms/{roomId} -H "Authorization: Bearer $TOKEN"

# Check Redis for the cached value
docker-compose exec redis redis-cli GET "room:{roomId}"
# Expected: JSON string of the room data

# Check TTL
docker-compose exec redis redis-cli TTL "room:{roomId}"
# Expected: ~300 (seconds)

# Fetch the same room again (cache hit, no DB query)
# Check your application logs -- should say "cache HIT"

# 4. Test invite code expiration
# Create an invite code
curl -X POST http://localhost:3001/rooms/{roomId}/invite \
  -H "Authorization: Bearer $TOKEN"
# Note the invite code

# Verify it exists in Redis
docker-compose exec redis redis-cli GET "invite:{code}"
docker-compose exec redis redis-cli TTL "invite:{code}"
# Expected: ~172800 seconds (48 hours)

# 5. Test rate limiting
# Hit the login endpoint rapidly
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "alice@test.com", "password": "wrong"}'
done
# Expected: First 5 return 401 (wrong password), 6th returns 429 (rate limited)

# 6. Test cache invalidation
# Update a room
curl -X PATCH http://localhost:3001/rooms/{roomId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Check Redis -- the cached value should be gone
docker-compose exec redis redis-cli GET "room:{roomId}"
# Expected: (nil)

# 7. Check online users (santa-notifications)
curl http://localhost:3002/users/online
# Expected: [] (empty until WebSocket connections are implemented)

# 8. Monitor Redis in real-time
docker-compose exec redis redis-cli MONITOR
# Shows every command executed against Redis -- useful for debugging
```
