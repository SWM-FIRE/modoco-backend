import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { TYPES } from './constants/types.enum';
import { CreateFriendDto } from './dto';
import { FriendsService } from './friends.service';
import { FriendshipStatus } from './types/friendship.type';

@ApiTags('friendships')
@Controller('friendships')
@UseGuards(JwtGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // friend requests
  // add friend
  @Post()
  addFriend(@Body() dto: CreateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.addFriend(dto, user);
  }

  // get friendship table
  @ApiOperation({
    summary: 'Get FRIENDSHIP Table',
    description: '로그인한 유저에 대한 FRIENDSHIP Table 모두 반환',
  })
  @ApiOkResponse({
    description: '모든 친구 요청, 신청, 수락 상태를 반환',
    schema: {
      example: [
        {
          status: 'PENDING',
          receiver: {
            uid: 3,
            nickname: '주형',
            email: '주형@a.com',
            avatar: 4,
          },
        },
        {
          status: 'ACCEPTED',
          sender: {
            uid: 2,
            nickname: '영기',
            email: '영기@a.com',
            avatar: 1,
          },
        },
        {
          status: 'PENDING',
          sender: {
            uid: 5,
            nickname: '하령',
            email: '하령@a.com',
            avatar: 5,
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiBearerAuth('access_token')
  @Get()
  getFriendship(
    @GetUserDecorator() user: User,
    @Query()
    query: { status?: FriendshipStatus; type?: TYPES; friend?: number },
  ) {
    if (query.status) {
      // status=ACCEPTED or status=PENDING or status=YOU
      return this.friendsService.getFriendshipsByStatus(user, query.status);
    }

    if (query.friend) {
      // query param은 string으로 들어옴
      if (typeof query.friend === 'string') {
        query.friend = parseInt(query.friend, 10);
      }
      // ?friend=1
      return this.friendsService.getFriendshipByFriendUid(user, query.friend);
    }

    if (query.type) {
      // ?types=SENT or ?types=RECEIVED
      return this.friendsService.getPendingFriendshipsByType(user, query.type);
    }

    // no query param
    return this.friendsService.getFriendship(user);
  }
}
