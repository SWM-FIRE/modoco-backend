import { IsNotEmpty, IsString } from 'class-validator';

export class ChatMessagePayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
