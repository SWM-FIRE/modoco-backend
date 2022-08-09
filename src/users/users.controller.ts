import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateUserDTO } from './dto';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() user: CreateUserDTO) {
    return this.usersService.create(user);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    console.log(req);
    return req.user;
    //return this.usersService.findOne();
  }

  @Get(':uid')
  async findOne(@Param('uid') uid: number) {
    return this.usersService.findOne(uid);
  }

  @Put()
  update(@Body() user: CreateUserDTO) {
    this.usersService.update(user);
  }

  @Delete()
  remove(@Body('uid') uid: number) {
    this.usersService.delete(uid);
  }
}
