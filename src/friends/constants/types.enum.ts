export const TYPES = {
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
} as const;

export type TYPES = typeof TYPES[keyof typeof TYPES];
