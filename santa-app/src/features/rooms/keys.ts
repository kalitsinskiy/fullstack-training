export const roomKeys = {
  all: ['rooms'] as const,
  list: (page: number, limit: number) => ['rooms', page, limit] as const,
  detail: (id: string) => ['rooms', id] as const,
  assignment: (id: string) => ['rooms', id, 'assignment'] as const,
  wishlist: (roomId: string, userId: string) =>
    ['rooms', roomId, 'wishlist', userId] as const,
} as const;
