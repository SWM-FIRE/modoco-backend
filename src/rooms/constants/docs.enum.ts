export const API_DOC_TYPE = {
  CREATE_ROOM: 'CREATE_ROOM',
  FIND_All_ROOMS: 'FIND_All_ROOMS',
  FIND_ROOM_BY_ID: 'FIND_ROOM_BY_ID',
  REMOVE_ROOM_BY_ID: 'REMOVE_ROOM_BY_ID',
} as const;

export type API_DOC_TYPE = typeof API_DOC_TYPE[keyof typeof API_DOC_TYPE];
