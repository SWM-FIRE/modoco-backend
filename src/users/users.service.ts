import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import {
  isAlreadyExistsError,
  isNotFoundError,
} from 'src/common/util/prisma-error.util';
import { EmailService } from 'src/email/email.service';
import { CreateUserDTO, UpdateUserDTO } from './dto';
import { generateSignupVerifyToken } from './helper/user.utils';
import { UsersDatabaseHelper } from './helper/users-database.helper';

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly emailService: EmailService,
  ) {}

  private readonly logger = new Logger('UsersService');

  async createUser(dto: CreateUserDTO) {
    try {
      const hash = await AuthService.generateHash(dto.password);
      const verifyToken = generateSignupVerifyToken();

      const user = await this.usersDatabaseHelper.createUser(
        dto.nickname,
        dto.email,
        hash,
        verifyToken,
        dto.avatar,
      );

      await this.emailService.sendVerificationMail(
        user.uid,
        user.nickname,
        user.email,
        verifyToken,
      );
    } catch (error) {
      // user record already exists
      if (isAlreadyExistsError(error)) {
        const existingUser = await this.usersDatabaseHelper.getUserByEmail(
          dto.email,
        );
        if (!existingUser.verified) {
          // send verification email again
          await this.emailService.sendVerificationMail(
            existingUser.uid,
            existingUser.nickname,
            existingUser.email,
            existingUser.verify_token,
          );
        }
      }
    } finally {
      return "Email verification sent. Please check your email to verify your account. If you don't receive the email, please check your spam folder.";
    }
  }

  async checkSignupVerificationToken(uid: number, verifyToken: string) {
    try {
      const { verified, verify_token } =
        await this.usersDatabaseHelper.getUserByUid(uid);

      if (!verified && verify_token === verifyToken) {
        const user = await this.usersDatabaseHelper.verifyUserSignup(uid);
        // send signup congratulation email
        await this.emailService.sendSignupSucceedMail(
          user.nickname,
          user.email,
        );
      }
    } catch (error) {
      throw new ForbiddenException('Invalid verification token');
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

  async getMyInformation(user: User) {
    try {
      delete user.verify_token;
      delete user.hash;

      return user;
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
  async getAnotherUserByUid(uid: number) {
    try {
      const user = await this.usersDatabaseHelper.getUserByUid(uid);
      delete user.verified;
      delete user.verify_token;

      return user;
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
      if (isNotFoundError(error)) {
        this.logger.debug('[Update] User not found');
      }
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
      if (isNotFoundError(error)) {
        this.logger.debug('[Delete] User not found');
      }
    }
  }
}
