import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@ApiTags('socket')
export class ChatMessagePayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsNumber()
  @IsNotEmpty()
  sender: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
