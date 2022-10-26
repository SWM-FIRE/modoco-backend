import { ForbiddenException, Injectable } from '@nestjs/common';
import { STATUS } from '../constants/status.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendshipStatus } from '../types/friendship.type';

@Injectable()
export class FriendsDatabaseHelper {
  constructor(private readonly prisma: PrismaService) {}

  createFriendship(userUid: number, friendUid: number) {
    return this.prisma.friendship.create({
      data: {
        friendFrom: userUid,
        friendTo: friendUid,
      },
    });
  }

  getAcceptedFriendships(userUid: number) {
    return this.getFriendshipsByStatus(userUid, STATUS.ACCEPTED);
  }

  getFriendshipsByStatus(userUid: number, status: FriendshipStatus) {
    return this.prisma.friendship.findMany({
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
  }

  async checkIfFriendshipExists(userUid: number, friendUid: number) {
    const hasFriendToUserFriendship =
      await this.checkFriendToUserFriendshipExists(userUid, friendUid);
    if (hasFriendToUserFriendship) {
      throw new ForbiddenException('Already has friendship relation');
    }
  }

  /**
   * check if friend to user friendship exists
   * @param {number} userUid user uid
   * @param {number} friendUid friend uid
   */
  private async checkFriendToUserFriendshipExists(
    userUid: number,
    friendUid: number,
  ) {
    const friendshipCount = await this.prisma.friendship.count({
      where: {
        friendFrom: friendUid,
        friendTo: userUid,
      },
    });

    return friendshipCount > 0;
  }
}
