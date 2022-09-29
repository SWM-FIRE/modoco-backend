import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { STATUS } from './constants/status.enum';
import { TYPES } from './constants/types.enum';
import { CreateFriendDto, DeleteFriendDto, UpdateFriendDto } from './dto';
import { FriendsService } from './friends.service';
import { FriendshipQueryParams } from './types/friendship.type';

@ApiTags('friendships')
@Controller('friendships')
@UseGuards(JwtGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // friend requests
  // add friend
  @ApiOperation({
    summary: '친구 요청',
    description: '친구 요청을 합니다. PENDING 상태가 됩니다.',
  })
  @ApiCreatedResponse({
    description: '친구 요청 성공',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiBearerAuth('access_token')
  @Post()
  addFriend(@Body() dto: CreateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.addFriend(user.uid, dto.friend);
  }

  // get friendship table
  @ApiQuery({
    name: 'status',
    enum: STATUS,
    required: false,
    description: '친구 관계를 쿼리 파라미터로 필터링해서 가져옵니다',
  })
  @ApiQuery({
    name: 'type',
    enum: TYPES,
    required: false,
    description:
      '친구 요청 종류. RECEIVED: 나에게 온 요청, SENT: 내가 보낸 요청',
  })
  @ApiQuery({
    name: 'friend',
    type: Number,
    required: false,
    description:
      '다른 사람과 나의 친구 관계를 조회할 때 사용. friend uid를 입력',
  })
  @ApiOperation({
    summary: '친구 관계 가져오기',
  })
  @ApiOkResponse({
    description: '모든 친구 요청, 신청, 수락 상태를 반환',
    schema: {
      example: [
        {
          status: 'PENDING',
          type: 'RECEIVER',
          receiver: {
            uid: 3,
            nickname: '주형',
            email: '주형@a.com',
            avatar: 4,
          },
        },
        {
          status: 'ACCEPTED',
          type: 'SENDER',
          sender: {
            uid: 2,
            nickname: '영기',
            email: '영기@a.com',
            avatar: 1,
          },
        },
        {
          status: 'PENDING',
          type: 'RECEIVER',
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
    query: FriendshipQueryParams,
  ) {
    return this.friendsService.getFriendshipByParams(user.uid, query);
  }

  // accept friend request
  @ApiOperation({
    summary: '친구 요청 수락',
    description: '친구 요청을 수락합니다. ACCEPTED 상태가 됩니다.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiBearerAuth('access_token')
  @Put()
  acceptFriendRequest(@Body() dto: UpdateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.acceptFriendRequest(user.uid, dto.friend);
  }

  // delete friendship
  @ApiOperation({
    summary: '친구 관계 삭제',
    description: '친구 관계를 삭제합니다.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiBearerAuth('access_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  deleteFriendship(@Body() dto: DeleteFriendDto, @GetUserDecorator() user) {
    return this.friendsService.deleteFriendshipByFriendUid(
      user.uid,
      dto.friend,
    );
  }
}
