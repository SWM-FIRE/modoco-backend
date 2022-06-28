import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './interfaces/room.interface';
import { CreateRoomDto } from './dto/room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    this.roomsService.create(createRoomDto);
  }

  @Get()
  async findAll(): Promise<Room[]> {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.getOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.deleteOne(id);
  }
}
