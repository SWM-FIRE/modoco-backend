import { IsNotEmpty, IsString } from 'class-validator';

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
