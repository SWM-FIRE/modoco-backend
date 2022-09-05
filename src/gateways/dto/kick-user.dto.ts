import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiTags('socket')
export class KickUserPayload {
  @IsNotEmpty()
  @IsString()
  room: string;

  @IsNotEmpty()
  userToKick: {
    uid: number;
    sid: string;
  };
}
