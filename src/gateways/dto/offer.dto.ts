import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiTags('socket')
export class CallOfferPayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  offer: RTCSessionDescriptionInit;
}

@ApiTags('socket')
export class AnswerOfferPayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  answer: RTCSessionDescriptionInit;
}
