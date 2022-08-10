import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSessionDTO } from './dto';
import { SessionService } from './session.service';

@ApiTags('sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async create(@Body() dto: CreateSessionDTO) {
    return this.sessionService.create(dto);
  }
}
