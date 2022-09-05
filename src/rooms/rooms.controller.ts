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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { User } from 'src/users/dto';
import { CreateRoomDTO, GetRoomDTO } from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @ApiOperation({
    summary: 'Room 생성',
    description: 'Room 생성 API',
  })
  @ApiCreatedResponse({
    description: 'Room 생성 성공',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE3NSwiZW1haWwiOiJhc2RAYS5jb20iLCJpYXQiOjE2NjIzNzQyNTEsImV4cCI6MTY2MjQ2MDY1MX0.FeVh3pfkPFjqgylfMbCXaxfkyPewJpQTt0U0r_E5acY',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  @ApiBadRequestResponse({
    description: 'Bad request. Wrong syntax.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post()
  async createRoom(@GetUserDecorator() user: User, @Body() dto: CreateRoomDTO) {
    return this.roomsService.createRoom(user, dto);
  }

  @ApiOperation({
    summary: '모든 Room 조회',
    description: '모든 Room을 조회하는 API',
  })
  @ApiOkResponse({
    description: '모든 Room을 반환합니다.',
    schema: {
      example: [
        {
          itemId: 82,
          moderator: {
            nickname: '맥모닝프로',
            uid: 128,
            avatar: 13,
          },
          title: '핑크 덤벨',
          details: '핑크 덤벨팀 모각코중  🔥🔥🔥🔥',
          tags: ['펫탈로그', '모각코'],
          current: 0,
          total: 3,
          theme: 'fire',
        },
        {
          itemId: 81,
          moderator: {
            nickname: '현또',
            uid: 124,
            avatar: 13,
          },
          title: 'React할 사람',
          details: '리액트 사이드프로젝트 하실분',
          tags: ['React', 'Typescript'],
          current: 0,
          total: 3,
          theme: 'fire',
        },
      ],
    },
  })
  @Get()
  async findAllRooms(): Promise<GetRoomDTO[]> {
    return this.roomsService.findAllRooms();
  }

  @ApiOperation({
    summary: 'Room id로 조회',
    description: 'Room id로 Room을 정보를 조회하는 API',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiOkResponse({
    description: '모든 Room을 반환합니다.',
    schema: {
      example: {
        itemId: 82,
        moderator: {
          nickname: '맥모닝프로',
          uid: 128,
          avatar: 13,
        },
        title: '핑크 덤벨',
        details: '핑크 덤벨팀 모각코중  🔥🔥🔥🔥',
        tags: ['펫탈로그', '모각코'],
        current: 0,
        total: 3,
        theme: 'fire',
      },
    },
  })
  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get(':id')
  async findRoomById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetRoomDTO> {
    return this.roomsService.findRoomById(id);
  }

  @ApiOperation({
    summary: 'Room id로 Room 삭제',
    description: 'Room id로 Room을 삭제하는 API',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid token.',
  })
  @ApiNoContentResponse({
    description: 'Room 삭제 성공',
  })
  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async removeRoomById(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roomsService.removeRoomById(id);
  }
}
