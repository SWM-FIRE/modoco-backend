import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiTags('socket')
export class LeaveRoomPayload {
  @IsString()
  @IsNotEmpty()
  room: string;
}
