import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function ApiAuthDocument() {
  return applyDecorators(
    ApiBearerAuth('access_token'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid token.',
    }),
  );
}
