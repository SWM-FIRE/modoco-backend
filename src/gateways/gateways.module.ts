import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';
import { RoomGatewayService } from './room.gateway.service';
import { UsersService } from '../users/users.service';
import { AuthModule } from '../auth/auth.module';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';
import { UsersHelper } from 'src/users/helper/users.helper';
import { EmailService } from 'src/email/email.service';
import { RoomsDatabaseHelper } from '../rooms/helper/rooms-database.helper';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [
    RoomGateway,
    RoomGatewayService,
    RecordsService,
    UsersService,
    UsersDatabaseHelper,
    RoomsService,
    RoomsDatabaseHelper,
    UsersHelper,
    EmailService,
  ],
})
export class GatewayModule {}
