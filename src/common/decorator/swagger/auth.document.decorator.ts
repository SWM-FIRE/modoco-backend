import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiAuthDocument() {
  return applyDecorators(
    ApiBearerAuth('access_token'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid credentials.',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden. The credentials are valid but not sufficient to grant access. (ex) User is not verified.',
    }),
  );
}
