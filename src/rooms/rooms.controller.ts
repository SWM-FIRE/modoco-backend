import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoomDTO, GetRoomDTO } from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  async create(@Body() dto: CreateRoomDTO) {
    return this.roomsService.create(dto);
  }

  @Get()
  async findAll(): Promise<GetRoomDTO[]> {
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<GetRoomDTO> {
    return this.roomsService.getOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseIntPipe()) id: number): Promise<void> {
    return this.roomsService.deleteOne(id);
  }
}
