import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MediaStateChangePayload {
  @IsOptional()
  @IsString()
  sid?: string;

  @IsString()
  @IsNotEmpty()
  room: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
