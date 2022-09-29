import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_DOC_TYPE } from '../constants/docs.enum';

export function RoomsDocumentHelper(docType: API_DOC_TYPE) {
  switch (docType) {
    case API_DOC_TYPE.CREATE_ROOM:
      return createRoomDecorators();
    case API_DOC_TYPE.FIND_All_ROOMS:
      return findAllRoomsDecorators();
    case API_DOC_TYPE.FIND_ROOM_BY_ID:
      return findAllRoomByIdDecorators();
    case API_DOC_TYPE.REMOVE_ROOM_BY_ID:
      return removeRoomByIdDecorators;
  }
}

function createRoomDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: 'Room 생성',
      description: 'Room 생성 API',
    }),
    ApiCreatedResponse({
      description: 'Room 생성 성공',
      schema: {
        example: {
          itemId: 115,
          title: 'React 같이 할 분~',
          details: 'React를 뿌셔보고 싶은 분 들어오세용.',
          tags: ['React', 'Javascript'],
          total: 4,
          current: 0,
          theme: 'camping',
          moderator: {
            uid: 15,
            nickname: 'lambda',
            avatar: 16,
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden.',
    }),
    ApiBadRequestResponse({
      description: 'Bad request. Wrong syntax.',
    }),
  );
}

function findAllRoomsDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '모든 Room 조회',
      description: '모든 Room을 조회하는 API',
    }),
    ApiOkResponse({
      description: '모든 Room을 반환합니다.',
      schema: {
        example: [
          {
            itemId: 82,
            moderator: {
              nickname: '맥모닝프로',
              uid: 128,
              avatar: 13,
            },
            title: '핑크 덤벨',
            details: '핑크 덤벨팀 모각코중  🔥🔥🔥🔥',
            tags: ['펫탈로그', '모각코'],
            current: 0,
            total: 3,
            theme: 'fire',
          },
          {
            itemId: 81,
            moderator: {
              nickname: '현또',
              uid: 124,
              avatar: 13,
            },
            title: 'React할 사람',
            details: '리액트 사이드프로젝트 하실분',
            tags: ['React', 'Typescript'],
            current: 0,
            total: 3,
            theme: 'fire',
          },
        ],
      },
    }),
  );
}

function findAllRoomByIdDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: 'Room id로 조회',
      description: 'Room id로 Room을 정보를 조회하는 API',
    }),
    ApiOkResponse({
      description: '모든 Room을 반환합니다.',
      schema: {
        example: {
          itemId: 82,
          moderator: {
            nickname: '맥모닝프로',
            uid: 128,
            avatar: 13,
          },
          title: '핑크 덤벨',
          details: '핑크 덤벨팀 모각코중  🔥🔥🔥🔥',
          tags: ['펫탈로그', '모각코'],
          current: 0,
          total: 3,
          theme: 'fire',
        },
      },
    }),
  );
}

function removeRoomByIdDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: 'Room id로 Room 삭제',
      description: 'Room id로 Room을 삭제하는 API',
    }),
    ApiNoContentResponse({
      description: 'Room 삭제 성공',
    }),
  );
}
