export const STATUS = {
  ACCEPTED: 'ACCEPTED',
  PENDING: 'PENDING',
  YOU: 'YOU',
} as const;

export type STATUS = typeof STATUS[keyof typeof STATUS];
