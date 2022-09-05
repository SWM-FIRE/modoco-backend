import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
