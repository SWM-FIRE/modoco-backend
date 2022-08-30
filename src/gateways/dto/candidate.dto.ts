import { IsNotEmpty, IsString } from 'class-validator';

export class CandidatePayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  candidate: RTCIceCandidateInit;
}
