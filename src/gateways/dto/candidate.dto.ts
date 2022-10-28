import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ApiTags('socket')
export class CandidatePayload {
  @IsNumber()
  @IsNotEmpty()
  to: number;

  @IsNotEmpty()
  candidate: RTCIceCandidateInit;
}
