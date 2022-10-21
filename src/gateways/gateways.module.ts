import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomGateway } from './room.gateway';
import { RoomGatewayService } from './room.gateway.service';
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
    UsersDatabaseHelper,
    RoomsDatabaseHelper,
    UsersHelper,
    EmailService,
  ],
})
export class GatewayModule {}
