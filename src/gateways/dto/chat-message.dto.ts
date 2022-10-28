import { ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CHAT_MESSAGE_TYPE } from '../constants/message-type.enum';

@ApiTags('socket')
export class ChatMessagePayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsEnum(CHAT_MESSAGE_TYPE)
  @IsNotEmpty()
  type: CHAT_MESSAGE_TYPE;

  @IsNumber()
  @IsNotEmpty()
  from: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
