export type Thread = 'giftee' | 'santa';
export type Direction = 'in' | 'out';

export function mirrorThread(to: Thread): Thread {
  return to === 'giftee' ? 'santa' : 'giftee';
}

export function directionFor(senderId: string, me: string): Direction {
  return senderId === me ? 'out' : 'in';
}
