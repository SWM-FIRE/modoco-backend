import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSessionDocumentHelper } from './decorator/session-document.decorators';
import { CreateSessionDTO } from './dto';
import { SessionService } from './session.service';

@ApiTags('sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @CreateSessionDocumentHelper()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() dto: CreateSessionDTO) {
    return this.sessionService.create(dto);
  }
}
