import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JoinRoomPayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsNumber()
  @IsNotEmpty()
  uid: number;
}
