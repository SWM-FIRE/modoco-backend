import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { EmailService } from 'src/email/email.service';
import { UsersDatabaseHelper } from './helper/users-database.helper';
import { UsersHelper } from './helper/users.helper';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersHelper, UsersDatabaseHelper, EmailService],
  exports: [UsersHelper, UsersDatabaseHelper],
})
export class UsersModule {}
