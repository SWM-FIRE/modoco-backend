import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDTO, UpdateUserDTO } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger('UsersService');

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

      return this.authService.signToken(user.uid, user.email);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }
      //throw error;
    }
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          uid: true,
          nickname: true,
          avatar: true,
        },
      });

      return users;
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  /**
   *
   * @param uid user id
   * @returns user object
   */
  async findOne(uid: number) {
    try {
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

      if (!user) {
        throw new ForbiddenException('Invalid Credentials');
      }

      return user;
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  async update(user: User, dto: UpdateUserDTO) {
    try {
      let updatedUser = await this.prisma.user.update({
        where: {
          uid: user.uid,
        },
        data: {
          email: dto.email ? dto.email : user.email,
          nickname: dto.nickname ? dto.nickname : user.nickname,
          avatar: dto.avatar ? dto.avatar : user.avatar,
        },
      });

      // if password is provided update hash
      if (dto.password) {
        const hash = await this.authService.generateHash(dto.password);

        updatedUser = await this.prisma.user.update({
          where: {
            uid: user.uid,
          },
          data: {
            hash,
          },
        });
      }

      if (!updatedUser) {
        throw new ForbiddenException('Invalid Credentials');
      }

      delete updatedUser.hash;

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.warn('User not found');
        }
      } else {
        throw error;
      }
    }
  }

  async delete(uid: number) {
    try {
      await this.prisma.user.delete({
        where: {
          uid,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.warn('User not found');
        }
      } else {
        throw error;
      }
    }
  }
}
