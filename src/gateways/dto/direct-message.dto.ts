import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@ApiTags('socket')
export class DirectMessagePayload {
  @IsNotEmpty()
  @IsNumber()
  to: number; // uid

  @IsOptional()
  type?: string; // message, code, img, file, ...

  @IsNotEmpty()
  message: string; // message

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
