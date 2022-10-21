import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsDatabaseHelper } from './helper/rooms-database.helper';
import { AuthModule } from '../auth/auth.module';
import { UsersHelper } from '../users/helper/users.helper';

@Module({
  imports: [AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsDatabaseHelper, UsersHelper],
  exports: [RoomsDatabaseHelper],
})
export class RoomsModule {}
