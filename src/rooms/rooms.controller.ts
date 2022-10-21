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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { ApiAuthDocument } from 'src/common/decorator/swagger/auth.document.decorator';
import { API_DOC_TYPE } from './constants/rooms-docs.enum';
import { RoomsDocumentHelper } from './decorator/rooms-document.decorator';
import { CreateRoomDTO, GetRoomDTO } from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @RoomsDocumentHelper(API_DOC_TYPE.CREATE_ROOM)
  @ApiAuthDocument()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard)
  @Post()
  async createRoom(@GetUserDecorator() user: User, @Body() dto: CreateRoomDTO) {
    return this.roomsService.createRoom(user, dto);
  }

  @RoomsDocumentHelper(API_DOC_TYPE.FIND_All_ROOMS)
  @Get()
  async findAllRooms() {
    return this.roomsService.findAllRooms();
  }

  @RoomsDocumentHelper(API_DOC_TYPE.FIND_ROOM_BY_ID)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get(':id')
  async findRoomById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetRoomDTO> {
    return this.roomsService.findRoomById(id);
  }

  @RoomsDocumentHelper(API_DOC_TYPE.REMOVE_ROOM_BY_ID)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteRoomById(
    @Param('id', ParseIntPipe) id: number,
    @GetUserDecorator() user: User,
  ) {
    return this.roomsService.deleteRoomById(user, id);
  }
}
