import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKakaoUserDTO, CreateUserDTO, UpdateUserDTO } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger('UsersService');

  async createUser(dto: CreateUserDTO) {
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
          this.logger.debug('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }
      //throw error;
    }
  }

  async createKakaoUser(dto: CreateKakaoUserDTO) {
    console.log({ email: dto.email ? dto.email : null });

    try {
      const user = await this.prisma.user.create({
        data: {
          nickname: dto.nickname,
          email: dto.email ? dto.email : null,
          kakaoId: dto.kakaoId,
        },
      });

      return user; //this.authService.signToken(user.uid, user.email);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.debug('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }
      //throw error;
    }
  }

  async findAllUsers() {
    try {
      return await this.prisma.user.findMany({
        select: {
          uid: true,
          nickname: true,
          avatar: true,
        },
      });
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  /**
   *
   * @param {number} uid user id
   * @returns user object
   */
  async findUserByUid(uid: number) {
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

  async updateUser(user: User, dto: UpdateUserDTO) {
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

  async deleteUserById(uid: number) {
    try {
      await this.prisma.user.delete({
        where: {
          uid,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.debug('User not found');
        }
      } else {
        throw error;
      }
    }
  }

  async findUserByKakaoId(kakaoId: number) {
    try {
      return await this.prisma.user.findUnique({
        where: {
          kakaoId,
        },
        select: {
          uid: true,
          nickname: true,
          avatar: true,
        },
      });
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }
}
