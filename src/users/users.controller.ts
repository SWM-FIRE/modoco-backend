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
import { ApiTags } from '@nestjs/swagger';
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

  @UseGuards(JwtGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUserDecorator() user: User) {
    return user;
  }

  @UseGuards(JwtGuard)
  @Get(':uid')
  async findUserByUid(@Param('uid') uid: number) {
    if (typeof uid === 'number') return this.usersService.findUserByUid(uid);
  }

  @UseGuards(JwtGuard)
  @Put()
  updateUser(@GetUserDecorator() user: User, @Body() dto: UpdateUserDTO) {
    return this.usersService.updateUser(user, dto);
  }

  @UseGuards(JwtGuard)
  @Delete()
  deleteUserById(@Body('uid') uid: number) {
    if (typeof uid === 'number') return this.usersService.deleteUserById(uid);
  }
}
