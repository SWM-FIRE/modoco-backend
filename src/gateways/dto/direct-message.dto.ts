import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@ApiTags('socket')
export class DirectMessagePayload {
  @IsNotEmpty()
  @IsString()
  to: string; // uid

  @IsOptional()
  type?: string; // message, code, img, file, ...

  @IsNotEmpty()
  message: string; // message

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
