import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { User } from 'src/users/dto';
import { CreateRoomDTO, GetRoomDTO } from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async createRoom(@GetUserDecorator() user: User, @Body() dto: CreateRoomDTO) {
    return this.roomsService.createRoom(user, dto);
  }

  @Get()
  async findAllRooms(): Promise<GetRoomDTO[]> {
    return this.roomsService.findAllRooms();
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async findRoomById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetRoomDTO> {
    return this.roomsService.findRoomById(id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async removeRoomById(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roomsService.removeRoomById(id);
  }
}
