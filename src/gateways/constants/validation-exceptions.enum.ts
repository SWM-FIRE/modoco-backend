export const KICK_USER_EXCEPTION = {
  INVALID_CREDENTIAL: 'Invalid socket credentials',
  USER_NOT_IN_ROOM: 'User is not in the room',
  NO_SESSION: 'No session found for user',
  INVALID_TARGET: 'Target user not found',
  INVALID_ROOM: 'Invalid room is provided',
  NOT_MODERATOR: 'User is not the moderator of the room',
  IS_MODERATOR: 'You cannot kick yourself',
} as const;

export type KICK_USER_EXCEPTION =
  typeof KICK_USER_EXCEPTION[keyof typeof KICK_USER_EXCEPTION];
