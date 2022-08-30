import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveRoomPayload {
  @IsString()
  @IsNotEmpty()
  room: string;
}
