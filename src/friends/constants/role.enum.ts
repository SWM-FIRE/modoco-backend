export const ROLE = {
  SENDER: 'SENDER',
  RECEIVER: 'RECEIVER',
  SELF: 'SELF',
} as const;

export type ROLE = typeof ROLE[keyof typeof ROLE];
