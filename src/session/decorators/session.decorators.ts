import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function CreateSessionDocumentHelper() {
  return applyDecorators(
    ApiOperation({
      summary: '로그인',
      description: '로그인 API',
    }),
    ApiCreatedResponse({
      description: '유저 로그인 성공한 경우 로그인 jwt 토큰을 반환합니다.',
      schema: {
        example: {
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE3NSwiZW1haWwiOiJhc2RAYS5jb20iLCJpYXQiOjE2NjIzNzQyNTEsImV4cCI6MTY2MjQ2MDY1MX0.FeVh3pfkPFjqgylfMbCXaxfkyPewJpQTt0U0r_E5acY',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Bad request. Wrong syntax.',
    }),
  );
}
