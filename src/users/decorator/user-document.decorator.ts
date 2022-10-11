import { applyDecorators } from '@nestjs/common';
import { API_DOC_TYPE } from '../constants/users-docs.enum';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function UsersDocumentHelper(docType: API_DOC_TYPE) {
  switch (docType) {
    case API_DOC_TYPE.CREATE_USER:
      return createUserDecorators();
    case API_DOC_TYPE.FIND_ALL_USERS:
      return findAllUsersDecorators();
    case API_DOC_TYPE.GET_ME:
      return getMeDecorators();
    case API_DOC_TYPE.FIND_USER_BY_UID:
      return findAllUserByUidDecorators();
    case API_DOC_TYPE.UPDATE_USER:
      return updateUserDecorators();
    case API_DOC_TYPE.DELETE_USER_BY_UID:
      return deleteUserByUidDecorators();
  }
}

function createUserDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '유저 생성',
      description: '유저 생성 API',
    }),
    ApiCreatedResponse({
      description: '유저 생성 성공',
      schema: {
        example: {
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE3NSwiZW1haWwiOiJhc2RAYS5jb20iLCJpYXQiOjE2NjIzNzQyNTEsImV4cCI6MTY2MjQ2MDY1MX0.FeVh3pfkPFjqgylfMbCXaxfkyPewJpQTt0U0r_E5acY',
        },
      },
    }),
  );
}

function findAllUsersDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '모든 유저 조회',
      description: '유저를 조회하는 API',
    }),
    ApiOkResponse({
      description: '모든 유저들을 반환합니다.',
      schema: {
        example: [
          {
            uid: 1,
            nickname: '주형이당',
            avatar: 17,
          },
          {
            uid: 5,
            nickname: '영기당',
            avatar: 1,
          },
          {
            uid: 8,
            nickname: '하령당',
            avatar: 21,
          },
        ],
      },
    }),
  );
}

function getMeDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '자신의 정보 조회',
      description: '로그인한 유저에 대한 정보를 조회 API',
    }),
    ApiOkResponse({
      description: '로그인한 유저 정보 반환.',
      schema: {
        example: {
          uid: 1,
          createdAt: '2022-09-21T16:50:15.079Z',
          updatedAt: '2022-10-11T18:22:35.208Z',
          nickname: 'u1',
          email: 'myemail@gmail.com',
          status_quo: 'I am a student',
          avatar: 4,
          github_link: 'http://github.com/mygithub',
          blog_link: 'http://coding-groot.tistory.com',
          groups: ['PythonLearner', 'SWM13'],
          badges: ['PythonContest Top10', 'Bronze'],
          verified: true,
          githubId: null,
          googleId: null,
          kakaoId: null,
        },
      },
    }),
  );
}

function findAllUserByUidDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: 'uid로 유저 조회',
      description: 'uid로 유저 정보를 조회하는 API',
    }),
    ApiOkResponse({
      description:
        '유저가 있는 경우, 유저 정보를 반환합니다. 없는 경우는 아무것도 반환하지 않습니다.',
      schema: {
        example: {
          uid: 1123,
          nickname: 'myNickname',
          avatar: 16,
        },
      },
    }),
  );
}

function updateUserDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '유저 정보 업데이트',
      description: 'User 데이터로 유저 정보를 업데이트하는 API',
    }),
    ApiOkResponse({
      description:
        '유저가 있는 경우, 유저 정보를 반환합니다. 없는 경우는 아무것도 반환하지 않습니다.',
      schema: {
        example: {
          uid: 1,
          createdAt: '2022-09-21T16:50:15.079Z',
          updatedAt: '2022-10-11T18:22:35.208Z',
          nickname: 'groot',
          email: 'goodafter@coding.com',
          status_quo: 'I am still hungry',
          avatar: 4,
          github_link: '',
          blog_link: 'http://modocode.com',
          groups: ['React', 'DevOps'],
          badges: ['React Champion', 'TOP 10'],
        },
      },
    }),
  );
}

function deleteUserByUidDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '유저 계정 삭제',
      description:
        '로그인한 유저와 일치하는 uid를 보냈을 때 유저 계정을 삭제하는 API',
    }),
    ApiBody({
      schema: {
        properties: {
          uid: { type: 'number' },
        },
        example: {
          uid: 21,
        },
      },
    }),
    ApiNoContentResponse({
      description: '유저 삭제 성공',
      schema: {
        example: '',
      },
    }),
  );
}
