import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { CreateFriendDto } from './dto';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // friend requests
  // add friend
  @Post()
  addFriend(@Body() dto: CreateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.addFriend(dto, user);
  }
}
