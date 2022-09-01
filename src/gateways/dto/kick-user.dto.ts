import { IsNotEmpty, IsString } from 'class-validator';

export class KickUserPayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsNotEmpty()
  userToKick: {
    uid: string;
    sid: string;
  };
}
