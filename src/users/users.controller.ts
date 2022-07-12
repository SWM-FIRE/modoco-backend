import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { CreateUserDTO } from './dto';
import { UsersService } from './users.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() user: CreateUserDTO): Promise<CreateUserDTO> {
    return this.usersService.create(user);
  }

  @Get()
  async findAll(): Promise<CreateUserDTO[]> {
    return this.usersService.findAll();
  }

  @Put()
  update(@Body() user: CreateUserDTO) {
    this.usersService.update(user);
  }

  @Delete()
  remove(@Body('uid') uid: string) {
    this.usersService.delete(uid);
  }
}
