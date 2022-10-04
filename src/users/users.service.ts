import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateGithubUserDTO,
  CreateGoogleUserDTO,
  CreateKakaoUserDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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

  async createKakaoUser(dto: CreateKakaoUserDTO): Promise<User> {
    const avatar = this.getRandomAvatar();
    try {
      const user = await this.prisma.user.create({
        data: {
          nickname: dto.nickname,
          email: dto.email ? dto.email : null,
          kakaoId: dto.kakaoId,
          avatar,
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

      throw error;
    }
  }

  async createGithubUser(dto: CreateGithubUserDTO): Promise<User> {
    const avatar = this.getRandomAvatar();

    try {
      const user = await this.prisma.user.create({
        data: {
          nickname: dto.nickname,
          email: dto.email,
          githubId: dto.githubId,
          avatar,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.debug('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }

      throw error;
    }
  }

  async createGoogleUser(dto: CreateGoogleUserDTO): Promise<User> {
    const avatar = this.getRandomAvatar();

    try {
      const user = await this.prisma.user.create({
        data: {
          nickname: dto.nickname,
          email: dto.email,
          googleId: dto.googleId,
          avatar,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.debug('User already exists');
          throw new ForbiddenException('User already exists');
        }
      }

      throw error;
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
   * find user by uid
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

  /**
   * delete user by uid
   * @param uid uid of user to delete given by body of request
   * @param loginUserId uid of user logged in
   */
  async deleteUserByUid(uid: number, loginUserId: number) {
    // check if correct user id is given
    if (uid !== loginUserId) {
      return;
    }

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

  async findUserByKakaoId(kakaoId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: {
          kakaoId,
        },
      });
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  async findUserByGithubId(githubId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: {
          githubId,
        },
      });
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  async findUserByGoogleId(googleId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: {
          googleId,
        },
      });
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  getRandomAvatar(): number {
    const min = 1;
    const max = this.configService.get('AVATAR_MAX_COUNT') as number;

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
