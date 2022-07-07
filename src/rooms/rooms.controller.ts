import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RoomDto } from './dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  async create(@Body() dto: RoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  async findAll(): Promise<RoomDto[]> {
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomsService.getOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(id);
    return this.roomsService.deleteOne(id);
  }
}
