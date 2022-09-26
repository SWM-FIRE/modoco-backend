export const TYPES = {
  SENT: 'sent',
  RECEIVED: 'received',
} as const;

export type TYPES = typeof TYPES[keyof typeof TYPES];
