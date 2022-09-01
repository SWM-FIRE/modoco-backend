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
import { CreateRoomDTO, GetRoomDTO } from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@GetUserDecorator() user, @Body() dto: CreateRoomDTO) {
    return this.roomsService.create(user, dto);
  }

  @Get()
  async findAll(): Promise<GetRoomDTO[]> {
    return this.roomsService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async findOne(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<GetRoomDTO> {
    return this.roomsService.findRoomById(id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(@Param('id', new ParseIntPipe()) id: number): Promise<void> {
    return this.roomsService.deleteOne(id);
  }
}
