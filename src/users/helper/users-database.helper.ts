import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDTO } from '../dto';
import { UsersHelper } from './users.helper';

@Injectable()
export class UsersDatabaseHelper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly usersHelper: UsersHelper,
  ) {}

  createUser(
    nickname: string,
    email: string,
    hash: string,
    verifyToken: string,
    avatar: number,
  ) {
    return this.prisma.user.create({
      data: {
        nickname,
        email,
        hash,
        avatar,
        verify_token: verifyToken,
      },
    });
  }

  createKakaoUser(
    nickname: string,
    email: string,
    kakaoId: string,
    avatar?: number,
  ) {
    return this.prisma.user.create({
      data: {
        nickname,
        email,
        kakaoId,
        verified: true,
        avatar: avatar ? avatar : this.usersHelper.getRandomAvatar(),
      },
    });
  }

  createGithubUser(
    nickname: string,
    email: string,
    githubId: string,
    avatar?: number,
  ) {
    return this.prisma.user.create({
      data: {
        nickname,
        email,
        githubId,
        verified: true,
        avatar: avatar ? avatar : this.usersHelper.getRandomAvatar(),
      },
    });
  }

  createGoogleUser(
    nickname: string,
    email: string,
    googleId: string,
    avatar?: number,
  ) {
    return this.prisma.user.create({
      data: {
        nickname,
        email,
        googleId,
        verified: true,
        avatar: avatar ? avatar : this.usersHelper.getRandomAvatar(),
      },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        uid: true,
        nickname: true,
        avatar: true,
      },
    });
  }

  async getUserByUid(uid: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
      select: {
        uid: true,
        nickname: true,
        avatar: true,
        verified: true,
        verify_token: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid Credentials');
    }

    return user;
  }

  async updateUser(user: User, dto: UpdateUserDTO) {
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
  }

  deleteUserByUid(uid: number, loginUserId: number) {
    // check if correct user id is given
    if (uid !== loginUserId) {
      throw new ForbiddenException('Invalid Credentials');
    }

    return this.prisma.user.delete({
      where: {
        uid,
      },
    });
  }

  findUserByKakaoId(kakaoId: string) {
    return this.prisma.user.findUnique({
      where: {
        kakaoId,
      },
    });
  }

  findUserByGithubId(githubId: string) {
    return this.prisma.user.findUnique({
      where: {
        githubId,
      },
    });
  }

  findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: {
        googleId,
      },
    });
  }

  verifyUserSignup(uid) {
    return this.prisma.user.update({
      where: {
        uid,
      },
      data: {
        verified: true,
      },
    });
  }

  checkUserVerified(uid: number) {
    return this.prisma.user.findUnique({
      where: {
        uid,
      },
      select: {
        verified: true,
      },
    });
  }

  async checkUserExistsByEmail(email: string) {
    const count = await this.prisma.user.count({
      where: {
        email,
      },
    });
    return count > 0;
  }

  async checkUserExistsByUid(uid: number) {
    const count = await this.prisma.user.count({
      where: {
        uid,
      },
    });
    return count > 0;
  }
}
