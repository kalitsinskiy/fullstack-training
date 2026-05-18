import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-api',
    ),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    AuthModule,
    UsersModule,
    RoomsModule,
    WishlistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
