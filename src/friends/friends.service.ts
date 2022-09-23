import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFriendDto } from './dto';

@ApiTags('users')
@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger('FriendsService');

  // add friend
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

  // get friendship table
  async getFriendship(user: User) {
    const friendship: FriendshipResult[] =
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

    const results: FriendshipDTO[] = [];

    friendship.forEach((fs) => {
      const result: FriendshipDTO = {
        status: fs.status,
      };

      if (fs.friendship_friendFromTousers.uid === user.uid) {
        // user is sender
        result.receiver = fs.friendship_friendToTousers;
      } else {
        // user is receiver
        result.sender = fs.friendship_friendFromTousers;
      }

      results.push(result);
    });

    return results;
  }
}
