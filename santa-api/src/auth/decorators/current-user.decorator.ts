import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 *
 * Usage:
 *   @CurrentUser()       -> returns the full user object
 *   @CurrentUser('id')   -> returns only user.id
 *   @CurrentUser('role') -> returns only user.role
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
