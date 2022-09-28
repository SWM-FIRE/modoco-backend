export const ROLE = {
  SENDER: 'SENDER',
  RECEIVER: 'RECEIVER',
} as const;

export type ROLE = typeof ROLE[keyof typeof ROLE];
