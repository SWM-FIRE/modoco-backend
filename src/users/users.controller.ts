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
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDTO, UpdateUserDTO } from './dto';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guard';
import { GetUserDecorator } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { ApiAuthDocument } from 'src/common/decorator/swagger/auth.document.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: '유저 생성',
    description: '유저 생성 API',
  })
  @ApiCreatedResponse({
    description: '유저 생성 성공',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE3NSwiZW1haWwiOiJhc2RAYS5jb20iLCJpYXQiOjE2NjIzNzQyNTEsImV4cCI6MTY2MjQ2MDY1MX0.FeVh3pfkPFjqgylfMbCXaxfkyPewJpQTt0U0r_E5acY',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User already exists.',
  })
  @ApiBadRequestResponse({
    description: 'Bad request. Wrong syntax.',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(@Body() user: CreateUserDTO) {
    return this.usersService.createUser(user);
  }

  @ApiOperation({
    summary: '모든 유저 조회',
    description: '유저를 조회하는 API',
  })
  @ApiOkResponse({
    description: '모든 유저들을 반환합니다.',
    schema: {
      example: [
        {
          uid: 1,
          nickname: '주형이당',
          avatar: 17,
        },
        {
          uid: 5,
          nickname: '영기당',
          avatar: 1,
        },
        {
          uid: 8,
          nickname: '하령당',
          avatar: 21,
        },
      ],
    },
  })
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @ApiOperation({
    summary: '자신의 정보 조회',
    description: '로그인한 유저에 대한 정보를 조회 API',
  })
  @ApiOkResponse({
    description: '로그인한 유저 정보 반환.',
    schema: {
      example: {
        uid: 134,
        createdAt: '2022-08-12T05:21:53.225Z',
        updatedAt: '2022-08-16T01:10:12.925Z',
        nickname: 'myNickname',
        email: 'email@gmail.com',
        avatar: 16,
      },
    },
  })
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUserDecorator() user: User) {
    return user;
  }

  @ApiOperation({
    summary: 'uid로 유저 조회',
    description: 'uid로 유저 정보를 조회하는 API',
  })
  @ApiOkResponse({
    description:
      '유저가 있는 경우, 유저 정보를 반환합니다. 없는 경우는 아무것도 반환하지 않습니다.',
    schema: {
      example: {
        uid: 1123,
        nickname: 'myNickname',
        avatar: 16,
      },
    },
  })
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get(':uid')
  async findUserByUid(@Param('uid', ParseIntPipe) uid: number) {
    return this.usersService.findUserByUid(uid);
  }

  @ApiOperation({
    summary: '유저 정보 업데이트',
    description: 'User 데이터로 유저 정보를 업데이트하는 API',
  })
  @ApiOkResponse({
    description:
      '유저가 있는 경우, 유저 정보를 반환합니다. 없는 경우는 아무것도 반환하지 않습니다.',
    schema: {
      example: {
        uid: 1123,
        nickname: 'myNickname',
        avatar: 16,
      },
    },
  })
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Put()
  updateUser(@GetUserDecorator() user: User, @Body() dto: UpdateUserDTO) {
    return this.usersService.updateUser(user, dto);
  }

  @ApiOperation({
    summary: '유저 계정 삭제',
    description:
      '로그인한 유저와 일치하는 uid를 보냈을 때 유저 계정을 삭제하는 API',
  })
  @ApiBody({
    schema: {
      properties: {
        uid: { type: 'number' },
      },
      example: {
        uid: 21,
      },
    },
  })
  @ApiNoContentResponse({
    description: '유저 삭제 성공',
    schema: {
      example: '',
    },
  })
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  deleteUserById(
    @Body('uid', ParseIntPipe) uid: number,
    @GetUserDecorator('uid') loginUserId: number,
  ) {
    return this.usersService.deleteUserById(uid, loginUserId);
  }
}
