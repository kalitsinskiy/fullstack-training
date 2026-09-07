import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Rejects a malformed Mongo id at the HTTP boundary with a 400.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ${metadata?.data ?? 'identifier'}: expected a 24-character hex id`,
      );
    }

    return value;
  }
}
