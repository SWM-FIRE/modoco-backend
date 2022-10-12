export const CHAT_MESSAGE_TYPE = {
  MESSAGE: 'MESSAGE',
  CODE: 'CODE',
} as const;

export type CHAT_MESSAGE_TYPE =
  typeof CHAT_MESSAGE_TYPE[keyof typeof CHAT_MESSAGE_TYPE];
