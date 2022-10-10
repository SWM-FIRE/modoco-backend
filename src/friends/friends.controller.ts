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
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { ApiAuthDocument } from 'src/common/decorator/swagger/auth.document.decorator';
import { API_DOC_TYPE } from './constants/friends-docs.enum';
import { FriendDocumentHelper } from './decorator/friend-document.decorator';
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
  @FriendDocumentHelper(API_DOC_TYPE.ADD_FRIEND)
  @ApiAuthDocument()
  @Post()
  addFriend(@Body() dto: CreateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.addFriend(user.uid, dto.friend);
  }

  // get friendship table
  @FriendDocumentHelper(API_DOC_TYPE.GET_FRIENDSHIPS)
  @ApiAuthDocument()
  @Get()
  getFriendship(
    @GetUserDecorator() user: User,
    @Query()
    query: FriendshipQueryParams,
  ) {
    return this.friendsService.getFriendshipByParams(user.uid, query);
  }

  // accept friend request
  @FriendDocumentHelper(API_DOC_TYPE.ACCEPT_FRIENDSHIP)
  @ApiAuthDocument()
  @Put()
  acceptFriendRequest(@Body() dto: UpdateFriendDto, @GetUserDecorator() user) {
    return this.friendsService.acceptFriendRequest(user.uid, dto.friend);
  }

  // delete friendship
  @FriendDocumentHelper(API_DOC_TYPE.DELETE_FRIENDSHIP)
  @ApiAuthDocument()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  deleteFriendship(@Body() dto: DeleteFriendDto, @GetUserDecorator() user) {
    return this.friendsService.deleteFriendshipByFriendUid(
      user.uid,
      dto.friend,
    );
  }
}
