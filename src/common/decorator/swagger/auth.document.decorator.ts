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
      description:
        '[Authentication Error] Invalid credentials. (ex) token is expired',
    }),
    ApiForbiddenResponse({
      description:
        '[Authorization Error] The credentials are valid but not sufficient to grant access. (ex) User is not verified.',
    }),
  );
}
