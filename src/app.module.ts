import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { GatewayModule } from './gateways/gateways.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import environmentConfig from './config/environmentConfig';
import swaggerConfig from './config/swaggerConfig';
import jwtConfig from './config/jwtConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig, swaggerConfig, jwtConfig],
      cache: true,
    }),
    UsersModule,
    RoomsModule,
    GatewayModule,
    PrismaModule,
    AuthModule,
    SessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
