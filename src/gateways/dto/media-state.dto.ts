import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MediaStateChangePayload {
  @IsOptional()
  @IsString()
  sid?: string;

  @IsNotEmpty()
  @IsString()
  room: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
