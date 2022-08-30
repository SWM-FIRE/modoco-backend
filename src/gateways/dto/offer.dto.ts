import { IsNotEmpty, IsString } from 'class-validator';

export class CallOfferPayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  offer: RTCSessionDescriptionInit;
}

export class AnswerOfferPayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  answer: RTCSessionDescriptionInit;
}
