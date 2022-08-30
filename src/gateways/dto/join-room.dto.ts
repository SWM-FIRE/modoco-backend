import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomPayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  uid: string;
}
