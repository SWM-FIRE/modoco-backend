import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { GatewayModule } from './gateways/gateways.module';
import { PrismaModule } from './prisma/prisma.module';
import environmentConfig from './config/environmentConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
      cache: true,
    }),
    UsersModule,
    RoomsModule,
    GatewayModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
