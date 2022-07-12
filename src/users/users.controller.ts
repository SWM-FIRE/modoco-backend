import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { User } from './dto';
import { UsersService } from './users.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() user: User): Promise<User> {
    return this.usersService.create(user);
  }

  @Put()
  update(@Body() user: User) {
    this.usersService.update(user);
  }

  @Delete()
  remove(@Body('uid') uid: string) {
    this.usersService.delete(uid);
  }
}
