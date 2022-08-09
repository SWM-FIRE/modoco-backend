import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDTO } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateUserDTO) {
    const hash = await this.authService.generateHash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          nickname: dto.nickname,
          email: dto.email,
          hash,
          avatar: dto.avatar,
        },
      });

      return user.nickname;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          console.warn('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }
      //throw error;
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        uid: true,
        nickname: true,
        avatar: true,
      },
    });

    return users;
  }

  /**
   *
   * @param uid user id
   * @returns user object
   */
  async findOne(uid: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
      select: {
        uid: true,
        nickname: true,
        avatar: true,
      },
    });
    return user;
  }

  async update(dto: CreateUserDTO) {
    try {
      const user = await this.prisma.user.update({
        where: {
          email: dto.email,
        },
        data: {
          ...dto,
        },
      });
      delete user.createdAt;

      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          console.warn('User not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }

  async delete(uid: number) {
    try {
      await this.prisma.user.delete({
        where: {
          uid,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          console.warn('User not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }
}
