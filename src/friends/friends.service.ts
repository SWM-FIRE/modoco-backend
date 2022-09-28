import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ROLE } from './constants/role.enum';
import { STATUS } from './constants/status.enum';
import { TYPES } from './constants/types.enum';
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
   * @param {number} friendUid friendUid
   * @param {number} userUid user uid
   * @returns {Promise<FriendshipResult>} friendship
   */
  async addFriend(userUid: number, friendUid: number) {
    try {
      const isUser = await this.prisma.user.count({
        where: {
          uid: friendUid,
        },
      });
      if (isUser === 0) {
        throw new ForbiddenException('Friend does not exist');
      }

      const friendship = await this.prisma.friendship.create({
        data: {
          friendFrom: userUid,
          friendTo: friendUid,
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
   * get accepted friend request
   * @param {number} userUid user uid
   * @param {number} friendUid target friend uid
   */
  acceptFriendRequest(userUid: number, friendUid: number) {
    return this.prisma.friendship.update({
      where: {
        friendFrom_friendTo: {
          friendFrom: friendUid,
          friendTo: userUid,
        },
      },
      data: {
        status: STATUS.ACCEPTED,
      },
    });
  }

  /**
   * delete friendship by friend uid
   * @param {user} user user
   * @param {number} friendUid target friend uid
   */
  deleteFriendshipByFriendUid(userUid: number, friendUid: number) {
    return this.prisma.friendship.delete({
      where: {
        friendFrom_friendTo: {
          friendFrom: userUid,
          friendTo: friendUid,
        },
      },
    });
  }

  private async checkRole(userUid: number, friendUid: number) {
    if (userUid === friendUid) {
      return ROLE.SELF;
    }

    const friendship = await this.getFriendshipByFriendUid(userUid, friendUid);
    if (friendship) {
      return friendship.role;
    }
  }

  /**
   *
   * @param {User} user user
   * @param {FriendshipQueryParams} query query param
   * @returns
   */
  getFriendshipByParams(userUid: number, query: FriendshipQueryParams) {
    if (query.status) {
      // status=ACCEPTED or status=PENDING or status=YOU
      return this.getFriendshipsByStatus(userUid, query.status);
    }

    if (query.friend) {
      // query param은 string으로 들어옴
      if (typeof query.friend === 'string') {
        query.friend = parseInt(query.friend, 10);
      }
      // ?friend=1
      return this.getFriendshipByFriendUid(userUid, query.friend);
    }

    if (query.type) {
      // ?types=SENT or ?types=RECEIVED
      return this.getPendingFriendshipsByType(userUid, query.type);
    }

    // no query param
    return this.getAllFriendship(userUid);
  }

  /**
   * get friendship table
   * @param {User} user user
   * @returns {Promise<FriendshipResult[]>} friendship
   */
  async getAllFriendship(userUid: number) {
    const friendships: FriendshipResult[] =
      await this.prisma.friendship.findMany({
        where: {
          OR: [
            {
              friendFrom: userUid,
            },
            {
              friendTo: userUid,
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

    return this.formatResults(friendships, userUid);
  }

  /**
   * return accepted friend request
   * @param {FriendshipStatus} status status
   * @param {User} user user
   * @returns {Promise<FriendshipResult[]>} accepted friends
   */
  private async getFriendshipsByStatus(
    userUid: number,
    status: FriendshipStatus,
  ) {
    const acceptedFriends: FriendshipResult[] =
      await this.prisma.friendship.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  friendFrom: userUid,
                },
                {
                  friendTo: userUid,
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

    return this.formatResults(acceptedFriends, userUid);
  }

  /**
   * Personal accept friend request
   * @param {number} userUid user uid
   * @param {number} friendUid friend uid
   * @returns {Promise<FriendshipResult>} friendship
   */
  private async getFriendshipByFriendUid(userUid: number, friendUid: number) {
    const acceptedFriends: FriendshipResult =
      await this.prisma.friendship.findFirst({
        where: {
          OR: [
            {
              AND: [{ friendFrom: userUid }, { friendTo: friendUid }],
            },
            {
              AND: [{ friendFrom: friendUid }, { friendTo: userUid }],
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

    return this.formatResult(acceptedFriends, userUid);
  }

  private getPendingFriendshipsByType(userUid: number, type: TYPES) {
    switch (type) {
      case TYPES.SENT:
        return this.getPendingSentFriendships(userUid);
      case TYPES.RECEIVED:
        return this.getPendingReceivedFriendships(userUid);
      default:
        return this.getAllFriendship(userUid);
    }
  }

  private async getPendingSentFriendships(userUid: number) {
    const sentPendingFriendRequests = await this.prisma.friendship.findFirst({
      where: {
        AND: [{ friendFrom: userUid }, { status: STATUS.PENDING }],
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

    return this.formatResult(sentPendingFriendRequests, userUid);
  }

  private async getPendingReceivedFriendships(userUid: number) {
    const receivedPendingFriendRequests =
      await this.prisma.friendship.findFirst({
        where: {
          AND: [{ friendTo: userUid }, { status: STATUS.PENDING }],
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

    return this.formatResult(receivedPendingFriendRequests, userUid);
  }

  private formatResults(friendship: FriendshipResult[], userUid: number) {
    const results: FriendshipDTO[] = [];

    friendship.forEach((fs) => {
      results.push(this.formatResult(fs, userUid));
    });
    return results;
  }

  private formatResult(friendship: FriendshipResult, userUid: number) {
    const result: FriendshipDTO = {
      status: friendship.status,
    };

    const isSender =
      friendship.friendship_friendFromTousers === undefined ||
      friendship.friendship_friendFromTousers.uid === userUid;

    if (isSender) {
      result.role = ROLE.SENDER; // User is the sender
      result.receiver = friendship.friendship_friendToTousers;
    } else {
      result.role = ROLE.RECEIVER; // User is the receiver
      result.sender = friendship.friendship_friendFromTousers;
    }

    return result;
  }
}
