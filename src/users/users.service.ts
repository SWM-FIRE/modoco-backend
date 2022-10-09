import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import {
  CreateGithubUserDTO,
  CreateGoogleUserDTO,
  CreateKakaoUserDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from './dto';
import { UsersDatabaseHelper } from './helper/users-database.helper';

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
  ) {}

  private readonly logger = new Logger('UsersService');

  async createUser(dto: CreateUserDTO) {
    try {
      const hash = await this.authService.generateHash(dto.password);
      const user = await this.usersDatabaseHelper.createUser(
        dto.nickname,
        dto.email,
        hash,
        dto.avatar,
      );

      return this.authService.signToken(user.uid, user.email);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
      }
      throw error;
    }
  }

  async createKakaoUser(dto: CreateKakaoUserDTO): Promise<User> {
    try {
      return await this.usersDatabaseHelper.createKakaoUser(
        dto.nickname,
        dto?.email,
        dto.kakaoId,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
      }
      throw error;
    }
  }

  async createGithubUser(dto: CreateGithubUserDTO): Promise<User> {
    try {
      return await this.usersDatabaseHelper.createGithubUser(
        dto.nickname,
        dto.email,
        dto.githubId,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
      }
      throw error;
    }
  }

  async createGoogleUser(dto: CreateGoogleUserDTO): Promise<User> {
    try {
      return await this.usersDatabaseHelper.createGoogleUser(
        dto.nickname,
        dto.email,
        dto.googleId,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
      }
      throw error;
    }
  }

  async findAllUsers() {
    try {
      return await this.usersDatabaseHelper.getAllUsers();
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
      return await this.usersDatabaseHelper.getUserByUid(uid);
    } catch (error) {
      this.logger.error({
        code: error.code,
        message: error.message,
      });
    }
  }

  /**
   * update user by uid
   * @param {User} user user which is logged in
   * @param {UpdateUserDTO} dto dto which contains data to update
   */
  async updateUser(user: User, dto: UpdateUserDTO) {
    try {
      return await this.usersDatabaseHelper.updateUser(user, dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn('User update failed: User not found');
      }
      throw error;
    }
  }

  /**
   * delete user by uid
   * @param uid uid of user to delete given by body of request
   * @param loginUserId uid of user logged in
   */
  async deleteUserByUid(uid: number, loginUserId: number) {
    try {
      await this.usersDatabaseHelper.deleteUserByUid(uid, loginUserId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.debug('User not found');
      }
      throw error;
    }
  }
}
