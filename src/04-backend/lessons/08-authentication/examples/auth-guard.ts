// ============================================
// NestJS Auth Guard & @CurrentUser Decorator
// ============================================
// This file is for reading/understanding — it runs inside a NestJS application.
// Copy and adapt these patterns for the App Task.

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
  CanActivate,
  SetMetadata,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// --- 1. JwtAuthGuard ---

/**
 * Wraps Passport's AuthGuard to customize error handling.
 * Use @UseGuards(JwtAuthGuard) on controllers or individual routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: any, user: T, info: any): T {
    if (err || !user) {
      // 'info' contains details like "TokenExpiredError" or "JsonWebTokenError"
      const message = info?.message || 'Authentication required';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}

// --- 2. @CurrentUser() Decorator ---

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

// --- 3. Roles Decorator + Guard ---

/**
 * Decorator to set required roles on a route.
 * Usage: @Roles('admin') or @Roles('admin', 'editor')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Guard that checks if the authenticated user has the required role.
 * Must be used AFTER JwtAuthGuard (user must be authenticated first).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this route
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user from the request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user's role is in the required roles.
    // 401 (Unauthorized) means "we don't know who you are" — handled by JwtAuthGuard above.
    // 403 (Forbidden) means "we know who you are, but you can't do this" — that's this case.
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

// --- 4. Convenience Decorator ---

/**
 * Combines JwtAuthGuard + RolesGuard + @Roles() into one decorator.
 * Usage: @Auth('admin') on a route to require admin role.
 */
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}

// --- 5. Usage example in a controller ---

/*
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // Any authenticated user can list their rooms
  @Get()
  @UseGuards(JwtAuthGuard)
  findMyRooms(@CurrentUser('id') userId: string) {
    return this.roomsService.findByUser(userId);
  }

  // Any authenticated user can create a room
  @Post()
  @UseGuards(JwtAuthGuard)
  createRoom(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(dto, user.id);
  }

  // Only admins can delete rooms
  @Delete(':id')
  @Auth('admin')
  deleteRoom(@Param('id') id: string) {
    return this.roomsService.delete(id);
  }
}
*/

export {};
