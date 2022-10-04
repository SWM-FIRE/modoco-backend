import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { API_DOC_TYPE } from '../constants/friends-docs.enum';
import { STATUS } from '../constants/status.enum';
import { TYPES } from '../constants/types.enum';

export function FriendDocumentHelper(docType: API_DOC_TYPE) {
  switch (docType) {
    case API_DOC_TYPE.ADD_FRIEND:
      return addFriendDecorators();
    case API_DOC_TYPE.GET_FRIENDSHIPS:
      return getFriendshipDecorators();
    case API_DOC_TYPE.ACCEPT_FRIENDSHIP:
      return acceptFriendshipDecorators();
    case API_DOC_TYPE.DELETE_FRIENDSHIP:
      return deleteFriendshipDecorators();
  }
}

function addFriendDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '친구 요청',
      description: '친구 요청을 합니다. PENDING 상태가 됩니다.',
    }),
    ApiCreatedResponse({
      description: '친구 요청 성공',
    }),
  );
}

function getFriendshipDecorators() {
  return applyDecorators(
    ApiQuery({
      name: 'status',
      enum: STATUS,
      required: false,
      description: '친구 관계를 쿼리 파라미터로 필터링해서 가져옵니다.',
    }),
    ApiQuery({
      name: 'type',
      enum: TYPES,
      required: false,
      description:
        '친구 요청 종류로 필터링합니다. RECEIVED: 나에게 온 요청, SENT: 내가 보낸 요청',
    }),
    ApiQuery({
      name: 'friend',
      type: Number,
      required: false,
      description:
        '다른 사람과 나의 친구 관계를 조회할 때 사용합니다. 확인하고 싶은 사람의 friend uid를 입력하세요.',
    }),
    ApiOperation({
      summary: '친구 관계 가져오기',
    }),
    ApiOkResponse({
      description: '모든 친구 요청, 신청, 수락 상태를 반환합니다.',
      schema: {
        example: [
          {
            status: 'PENDING',
            type: 'RECEIVER',
            receiver: {
              uid: 3,
              nickname: '주형',
              email: '주형@a.com',
              avatar: 4,
            },
          },
          {
            status: 'ACCEPTED',
            type: 'SENDER',
            sender: {
              uid: 2,
              nickname: '영기',
              email: '영기@a.com',
              avatar: 1,
            },
          },
          {
            status: 'PENDING',
            type: 'RECEIVER',
            sender: {
              uid: 5,
              nickname: '하령',
              email: '하령@a.com',
              avatar: 5,
            },
          },
        ],
      },
    }),
  );
}

function acceptFriendshipDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '친구 요청 수락',
      description: '친구 요청을 수락합니다. ACCEPTED 상태가 됩니다.',
    }),
  );
}

function deleteFriendshipDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: '친구 관계 삭제',
      description: '친구 관계를 삭제합니다.',
    }),
  );
}
