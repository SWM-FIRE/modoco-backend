import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFriendDto } from './dto';

@ApiTags('users')
@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger('FriendsService');

  // add friend
  async addFriend(dto: CreateFriendDto, user: any) {
    try {
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
}
