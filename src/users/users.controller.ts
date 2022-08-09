import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDTO } from './dto';
import { UsersService } from './users.service';

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
