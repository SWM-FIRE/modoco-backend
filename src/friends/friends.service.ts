import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  isAlreadyExistsError,
  isNotFoundError,
} from 'src/common/util/prisma-error.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';
import { ROLE } from './constants/role.enum';
import { STATUS } from './constants/status.enum';
import { TYPES } from './constants/types.enum';
import { validateAddFriendParams } from './helper/friend.util';
import { FriendsDatabaseHelper } from './helper/friends-database.helper';
import {
  FriendshipDTO,
  FriendshipQueryParams,
  FriendshipResult,
  FriendshipStatus,
} from './types/friendship.type';

@ApiTags('friendships')
@Injectable()
export class FriendsService {
  private readonly logger = new Logger('FriendsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly friendsDatabaseHelper: FriendsDatabaseHelper,
    private readonly userDatabaseHelper: UsersDatabaseHelper,
  ) {}

  /**
   * add friend
   * @param {number} friendUid friendUid
   * @param {number} userUid user uid
   * @returns {Promise<FriendshipResult>} friendship
   */
  async addFriend(userUid: number, friendUid: number) {
    try {
      // 1. check params
      await validateAddFriendParams(
        userUid,
        friendUid,
        this.userDatabaseHelper,
      );

      // 2. 이미 친구가 유저에게 보낸 friendship이 있는지 체크
      await this.friendsDatabaseHelper.checkIfFriendshipExists(
        userUid,
        friendUid,
      );

      // 3. create friendship
      return this.friendsDatabaseHelper.createFriendship(userUid, friendUid);
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        throw new ForbiddenException('Friend request already sent');
      } else {
        this.logger.error('[Add Friend] Error adding friend', error.stack);
      }
    }
  }

  /**
   * get accepted friend request
   * @param {number} userUid user uid
   * @param {number} friendUid target friend uid
   */
  async acceptFriendRequest(userUid: number, friendUid: number) {
    if (userUid === friendUid) {
      throw new ForbiddenException('Invalid friendship accept request');
    }

    try {
      return await this.prisma.friendship.update({
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
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new ForbiddenException('Pending friendship not found');
      }

      this.logger.error(
        '[Accept Friend Request] Error accepting friend',
        error.stack,
      );
      throw new ForbiddenException('Invalid friendship accept request');
    }
  }

  /**
   * delete friendship by friend uid
   * @param {user} user user
   * @param {number} friendUid target friend uid
   */
  async deleteFriendshipByFriendUid(userUid: number, friendUid: number) {
    const role = await this.checkRole(userUid, friendUid);
    if (role === ROLE.SELF) {
      throw new ForbiddenException('Invalid friendship deletion request');
    }

    if (role === ROLE.RECEIVER) {
      return this.prisma.friendship.delete({
        where: {
          friendFrom_friendTo: {
            friendFrom: friendUid,
            friendTo: userUid,
          },
        },
      });
    }

    if (role === ROLE.SENDER) {
      return this.prisma.friendship.delete({
        where: {
          friendFrom_friendTo: {
            friendFrom: userUid,
            friendTo: friendUid,
          },
        },
      });
    }
  }

  private async checkRole(userUid: number, friendUid: number) {
    if (userUid === friendUid) {
      return ROLE.SELF;
    }

    const friendship = await this.getFriendshipByFriendUid(userUid, friendUid);
    if (!friendship) {
      throw new ForbiddenException('Friendship does not exist');
    }

    return friendship.role;
  }

  /**
   *
   * @param {User} user user
   * @param {FriendshipQueryParams} query query param
   * @returns
   */
  async getFriendshipByParams(userUid: number, query: FriendshipQueryParams) {
    try {
      if (query.status) {
        // status=ACCEPTED or status=PENDING or status=YOU
        return this.getFriendshipsByStatus(userUid, query.status);
      }

      if (query.friend) {
        // query param은 string으로 들어옴
        if (typeof query.friend === 'string') {
          query.friend = parseInt(query.friend, 10);
        }

        // ?friend=123
        const friendship = await this.getFriendshipByFriendUid(
          userUid,
          query.friend,
        );
        if (friendship)
          return this.getFriendshipByFriendUid(userUid, query.friend);

        return {};
      }

      if (query.type) {
        // ?types=SENT or ?types=RECEIVED
        return this.getPendingFriendshipsByType(userUid, query.type);
      }

      // no query param
      return this.getAllFriendship(userUid);
    } catch (error) {
      this.logger.error(
        '[Get Friendship] Error getting friendship',
        error.stack,
      );
      // prisma catch not found error
      throw new ForbiddenException('Friendship error');
    }
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
   * return ACCEPTED or PENDING friend request
   * @param {FriendshipStatus} status ACCEPTED or PENDING
   * @param {User} user user
   * @returns {Promise<FriendshipResult[]>} fienships filtered by status
   */
  private async getFriendshipsByStatus(
    userUid: number,
    status: FriendshipStatus,
  ) {
    const friendships = await this.friendsDatabaseHelper.getFriendshipsByStatus(
      userUid,
      status,
    );

    return this.formatResults(friendships, userUid);
  }

  /**
   * Personal accept friend request
   * @param {number} userUid user uid
   * @param {number} friendUid friend uid
   * @returns {Promise<FriendshipResult>} friendship
   */
  private async getFriendshipByFriendUid(userUid: number, friendUid: number) {
    try {
      const acceptedFriends: FriendshipResult =
        await this.prisma.friendship.findFirstOrThrow({
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
    } catch (error) {
      // prisma catch not found error
      if (error instanceof Prisma.NotFoundError) {
        return null;
      } else {
        this.logger.error(
          '[Get Friendship] Error getting friendship',
          error.stack,
        );
      }
    }
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

  /**
   * check if user to friend friendship exists
   * @param {number} userUid user uid
   * @param {number} friendUid friend uid
   */
  private async checkUserToFriendFriendshipExists(
    userUid: number,
    friendUid: number,
  ) {
    const friendshipCount = await this.prisma.friendship.count({
      where: {
        friendFrom: userUid,
        friendTo: friendUid,
      },
    });

    return friendshipCount > 0;
  }
}
