import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomGateway } from './room.gateway';
import { RoomGatewayService } from './room.gateway.service';
import { AuthModule } from '../auth/auth.module';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';
import { UsersHelper } from 'src/users/helper/users.helper';
import { EmailService } from 'src/email/email.service';
import { RoomsDatabaseHelper } from '../rooms/helper/rooms-database.helper';
import { RoomGatewayHelper } from './helper/room-gateway.helper';
import { RedisModule } from 'src/redis/redis.module';
import { PlaylistGateway } from './playlist.gateway';
import { RedisSessionStore } from './class/redis-session.store';
import { RedisMessageStore } from './class/redis-message.store';
import { FriendsDatabaseHelper } from 'src/friends/helper/friends-database.helper';
import { ShutdownService } from 'src/services/shutdown.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AuthModule, RedisModule, HttpModule],
  controllers: [],
  providers: [
    RoomGateway,
    PlaylistGateway,
    RoomGatewayService,
    RecordsService,
    UsersDatabaseHelper,
    RoomsDatabaseHelper,
    UsersHelper,
    EmailService,
    RoomGatewayHelper,
    RedisSessionStore,
    RedisMessageStore,
    FriendsDatabaseHelper,
    ShutdownService,
  ],
})
export class GatewayModule {}
