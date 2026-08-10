import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

const metaFor = (data: string): ArgumentMetadata => ({ type: 'param', data });

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();
  const meta = metaFor('id');

  it('passes a valid ObjectId through unchanged', () => {
    const id = '665f0c2ab7d13a5e8b1c4d9f';

    expect(pipe.transform(id, meta)).toBe(id);
  });

  it.each([
    ['a non-hex string', 'not-an-object-id'],
    ['an empty string', ''],
    ['too few characters', '665f0c2ab7d13a5e8b1c4d9'],
    ['too many characters', '665f0c2ab7d13a5e8b1c4d9ff'],
    ['a 12-character non-hex string', 'abcdefghijkl'],
  ])('rejects %s with a 400', (_label, value) => {
    expect(() => pipe.transform(value, meta)).toThrow(BadRequestException);
  });

  it('names the offending parameter in the message', () => {
    expect(() => pipe.transform('junk', metaFor('userId'))).toThrow(
      'Invalid userId',
    );
  });

  it('falls back to a generic name when metadata is absent', () => {
    expect(() => pipe.transform('junk')).toThrow('Invalid identifier');
  });
});
