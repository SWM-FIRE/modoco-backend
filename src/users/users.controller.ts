import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDTO, UpdateUserDTO } from './dto';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guard';
import { GetUserDecorator } from 'src/auth/decorator';
import { User } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(@Body() user: CreateUserDTO) {
    return this.usersService.createUser(user);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUserDecorator() user: User) {
    return user;
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get(':uid')
  async findUserByUid(@Param('uid', ParseIntPipe) uid: number) {
    return this.usersService.findUserByUid(uid);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Put()
  updateUser(@GetUserDecorator() user: User, @Body() dto: UpdateUserDTO) {
    return this.usersService.updateUser(user, dto);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Delete()
  deleteUserById(@Body('uid', ParseIntPipe) uid: number) {
    return this.usersService.deleteUserById(uid);
  }
}
