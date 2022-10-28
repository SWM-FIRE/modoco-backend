import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ApiTags('socket')
export class CallOfferPayload {
  @IsNumber()
  @IsNotEmpty()
  to: number;

  @IsNotEmpty()
  offer: RTCSessionDescriptionInit;
}

@ApiTags('socket')
export class AnswerOfferPayload {
  @IsNumber()
  @IsNotEmpty()
  to: number;

  @IsNotEmpty()
  answer: RTCSessionDescriptionInit;
}
