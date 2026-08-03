import { mirrorThread, directionFor } from './thread';

describe('mirrorThread', () => {
  it("maps a send to the recipient's opposite chat", () => {
    expect(mirrorThread('giftee')).toBe('santa');
    expect(mirrorThread('santa')).toBe('giftee');
  });
});

describe('directionFor', () => {
  it('is "out" for my own message and "in" for the other side', () => {
    expect(directionFor('u1', 'u1')).toBe('out');
    expect(directionFor('u2', 'u1')).toBe('in');
  });
});
