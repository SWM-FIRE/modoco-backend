import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { STATUS } from './constants/status.enum';
import { TYPES } from './constants/types.enum';
import { CreateFriendDto } from './dto';
import {
  FriendshipDTO,
  FriendshipQueryParams,
  FriendshipResult,
  FriendshipStatus,
} from './types/friendship.type';

@ApiTags('friendships')
@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger('FriendsService');

  /**
   * add friend
   * @param {CreateFriendDto} dto dto
   * @param {User} user user
   * @returns {Promise<FriendshipResult>} friendship
   */
  async addFriend(dto: CreateFriendDto, user: User) {
    try {
      const isUser = await this.prisma.user.count({
        where: {
          uid: dto.friend,
        },
      });
      if (isUser === 0) {
        throw new ForbiddenException('Friend does not exist');
      }

      const friendship = await this.prisma.friendship.create({
        data: {
          friendFrom: user.uid,
          friendTo: dto.friend,
        },
      });

      return friendship;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Friend request already sent');
        }
      }
      throw error;
    }
  }

  /**
   *
   * @param {User} user user
   * @param {FriendshipQueryParams} query query param
   * @returns
   */
  getFriendshipByParams(user: User, query: FriendshipQueryParams) {
    if (query.status) {
      // status=ACCEPTED or status=PENDING or status=YOU
      return this.getFriendshipsByStatus(user, query.status);
    }

    if (query.friend) {
      // query param은 string으로 들어옴
      if (typeof query.friend === 'string') {
        query.friend = parseInt(query.friend, 10);
      }
      // ?friend=1
      return this.getFriendshipByFriendUid(user, query.friend);
    }

    if (query.type) {
      // ?types=SENT or ?types=RECEIVED
      return this.getPendingFriendshipsByType(user, query.type);
    }

    // no query param
    return this.getAllFriendship(user);
  }

  /**
   * get friendship table
   * @param {User} user user
   * @returns {Promise<FriendshipResult[]>} friendship
   */
  async getAllFriendship(user: User) {
    const friendships: FriendshipResult[] =
      await this.prisma.friendship.findMany({
        where: {
          OR: [
            {
              friendFrom: user.uid,
            },
            {
              friendTo: user.uid,
            },
          ],
        },
        select: {
          status: true,
          friendship_friendFromTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
          friendship_friendToTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

    return this.formatResults(friendships, user);
  }

  /**
   * return accepted friend request
   * @param {FriendshipStatus} status status
   * @param {User} user user
   * @returns {Promise<FriendshipResult[]>} accepted friends
   */
  private async getFriendshipsByStatus(user: User, status: FriendshipStatus) {
    const acceptedFriends: FriendshipResult[] =
      await this.prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  friendFrom: user.uid,
                },
                {
                  friendTo: user.uid,
                },
              ],
            },
            {
              status,
            },
          ],
        },
        select: {
          status: true,
          friendship_friendFromTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
          friendship_friendToTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

    return this.formatResults(acceptedFriends, user);
  }

  /**
   * Personal accept friend request
   * @param {User} user user
   * @param friendUid friend uid
   * @returns {Promise<FriendshipResult>} friendship
   */
  private async getFriendshipByFriendUid(user: User, friendUid) {
    const acceptedFriends: FriendshipResult =
      await this.prisma.friendship.findFirst({
        where: {
          OR: [
            {
              AND: [{ friendFrom: user.uid }, { friendTo: friendUid }],
            },
            {
              AND: [{ friendFrom: friendUid }, { friendTo: user.uid }],
            },
          ],
        },
        select: {
          status: true,
          friendship_friendFromTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
          friendship_friendToTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

    return this.formatResult(acceptedFriends, user);
  }

  private getPendingFriendshipsByType(user: User, type: TYPES) {
    switch (type) {
      case TYPES.SENT:
        return this.getPendingSentFriendships(user);
      case TYPES.RECEIVED:
        return this.getPendingReceivedFriendships(user);
      default:
        return this.getAllFriendship(user);
    }
  }

  private async getPendingSentFriendships(user: User) {
    const sentPendingFriendRequests = await this.prisma.friendship.findFirst({
      where: {
        AND: [{ friendFrom: user.uid }, { status: STATUS.PENDING }],
      },
      select: {
        status: true,
        friendship_friendToTousers: {
          select: {
            uid: true,
            nickname: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return this.formatResult(sentPendingFriendRequests, user);
  }

  private async getPendingReceivedFriendships(user: User) {
    const receivedPendingFriendRequests =
      await this.prisma.friendship.findFirst({
        where: {
          AND: [{ friendTo: user.uid }, { status: STATUS.PENDING }],
        },
        select: {
          status: true,
          friendship_friendFromTousers: {
            select: {
              uid: true,
              nickname: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

    return this.formatResult(receivedPendingFriendRequests, user);
  }

  private formatResults(friendship: FriendshipResult[], user: User) {
    const results: FriendshipDTO[] = [];

    friendship.forEach((fs) => {
      results.push(this.formatResult(fs, user));
    });
    return results;
  }

  private formatResult(friendship: FriendshipResult, user: User) {
    const result: FriendshipDTO = {
      status: friendship.status,
    };

    const isSender =
      friendship.friendship_friendFromTousers === undefined ||
      friendship.friendship_friendFromTousers.uid === user.uid;

    if (isSender) {
      // user is sender
      result.receiver = friendship.friendship_friendToTousers;
    } else {
      // user is receiver
      result.sender = friendship.friendship_friendFromTousers;
    }

    return result;
  }
}
