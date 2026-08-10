import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { EventsModule } from './events/events.module';
import { RedisModule } from './redis/redis.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production', 'test')
          .default('development'),
        MONGO_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('7d'),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
        SERVICE_API_KEY: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        skipIf: () => process.env.NODE_ENV === 'test',
        ...(process.env.NODE_ENV !== 'test' && {
          storage: new ThrottlerStorageRedisService(
            config.get<string>('REDIS_URL'),
          ),
        }),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.NODE_ENV === 'production'
            ? 'info'
            : process.env.NODE_ENV === 'test'
              ? 'silent'
              : 'debug',
        transport:
          process.env.NODE_ENV !== 'production' &&
          process.env.NODE_ENV !== 'test'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),
    EventsModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    WishlistModule,
    InternalModule,
  ],
  controllers: [AppController],
  providers: [
    LoggingInterceptor,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
