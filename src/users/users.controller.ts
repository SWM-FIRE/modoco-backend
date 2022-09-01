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
  async create(@Body() user: CreateUserDTO) {
    return this.usersService.create(user);
  }

  @UseGuards(JwtGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUserDecorator() user: User) {
    return user;
  }

  @UseGuards(JwtGuard)
  @Get(':uid')
  async findOne(@Param('uid', ParseIntPipe) uid: number) {
    return this.usersService.findOne(uid);
  }

  @UseGuards(JwtGuard)
  @Put()
  update(@GetUserDecorator() user: User, @Body() dto: UpdateUserDTO) {
    return this.usersService.update(user, dto);
  }

  @UseGuards(JwtGuard)
  @Delete()
  remove(@Body('uid', ParseIntPipe) uid: number) {
    return this.usersService.delete(uid);
  }
}
