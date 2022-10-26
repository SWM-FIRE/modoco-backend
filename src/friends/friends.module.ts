import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendsDatabaseHelper } from './helper/friends-database.helper';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsDatabaseHelper],
})
export class FriendsModule {}
