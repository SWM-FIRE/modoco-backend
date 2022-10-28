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
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDTO, UpdateUserDTO } from './dto';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guard';
import { GetUserDecorator } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { ApiAuthDocument } from 'src/common/decorator/swagger/auth.document.decorator';
import { UsersDocumentHelper } from './decorator/user-document.decorator';
import { API_DOC_TYPE } from './constants/users-docs.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UsersDocumentHelper(API_DOC_TYPE.CREATE_USER)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(@Body() user: CreateUserDTO) {
    return this.usersService.createUser(user);
  }

  @UsersDocumentHelper(API_DOC_TYPE.FIND_ALL_USERS)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UsersDocumentHelper(API_DOC_TYPE.GET_ME)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUserDecorator() user: User) {
    return this.usersService.getMyInformation(user);
  }

  @UsersDocumentHelper(API_DOC_TYPE.FIND_USER_BY_UID)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @Get(':uid')
  async getAnoterUserByUid(@Param('uid', ParseIntPipe) uid: number) {
    return this.usersService.getAnotherUserByUid(uid);
  }

  @UsersDocumentHelper(API_DOC_TYPE.VERIFY_USER_EMAIL)
  @Redirect('https://modocode.com')
  @Get(':uid/verify/:verifyToken')
  async verifyUser(
    @Param('uid', ParseIntPipe) uid: number,
    @Param('verifyToken') verifyToken: string,
  ) {
    return this.usersService.checkSignupVerificationToken(uid, verifyToken);
  }

  @UsersDocumentHelper(API_DOC_TYPE.UPDATE_USER)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Put()
  updateUser(@GetUserDecorator() user: User, @Body() dto: UpdateUserDTO) {
    return this.usersService.updateUser(user, dto);
  }

  @UsersDocumentHelper(API_DOC_TYPE.DELETE_USER_BY_UID)
  @ApiAuthDocument()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  deleteUserByUid(
    @Body('uid', ParseIntPipe) uid: number,
    @GetUserDecorator('uid') loginUserId: number,
  ) {
    return this.usersService.deleteUserByUid(uid, loginUserId);
  }
}
