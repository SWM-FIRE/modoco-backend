import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';
import { RoomGatewayService } from './room.gateway.service';
import { UsersService } from '../users/users.service';
import { AuthModule } from '../auth/auth.module';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';
import { UsersHelper } from 'src/users/helper/users.helper';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [
    RoomsService,
    RoomGateway,
    RoomGatewayService,
    RecordsService,
    UsersService,
    UsersDatabaseHelper,
    UsersHelper,
  ],
})
export class GatewayModule {}
