import { applyDecorators, type Type } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

/** Path params documented by room routes, described once each. */
const PARAM_DOCS = {
  id: {
    name: 'id',
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  },
  userId: {
    name: 'userId',
    description: 'Id of the member to remove',
    example: '665f0c2ab7d13a5e8b1c4d1a',
  },
} as const;

type ParamName = keyof typeof PARAM_DOCS;

interface ApiRoomRouteOptions {
  summary: string;
  /** Success status. Defaults to 200. */
  status?: number;
  /** Success description. */
  description: string;
  /** Success body DTO. Omit for 204, or where no DTO exists yet. */
  type?: Type<unknown>;
  /** Path params to document. Defaults to `['id']`; pass `[]` for none. */
  params?: readonly ParamName[];
  /** 400 description. Omitted when absent. */
  badRequest?: string;
  /** 403 description. Omitted when absent. */
  forbidden?: string;
  /** 404 description. Omitted when absent. */
  notFound?: string;
}

/**
 * Composes the Swagger block shared by every room route.
 *
 * `rooms.controller.ts` previously spelled out `@ApiResponse({ status: 401,
 * description: 'Unauthorized' })` eleven times, the same `@ApiParam` for `id`
 * ten times, and a 403/404 pair on most routes — roughly 45% of the file, which
 * buried the eleven route signatures a reader actually needs.
 *
 * Every route still declares whatever is specific to it; only the repetition is
 * gone. `401 Unauthorized` is emitted unconditionally because the whole
 * controller sits behind `JwtAuthGuard`.
 */
export function ApiRoomRoute(options: ApiRoomRouteOptions) {
  const {
    summary,
    status = 200,
    description,
    type,
    params = ['id'],
    badRequest,
    forbidden,
    notFound,
  } = options;

  return applyDecorators(
    ApiOperation({ summary }),
    ...params.map((name) => ApiParam(PARAM_DOCS[name])),
    ApiResponse({ status, description, ...(type ? { type } : {}) }),
    ...(badRequest
      ? [ApiResponse({ status: 400, description: badRequest })]
      : []),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ...(forbidden
      ? [ApiResponse({ status: 403, description: forbidden })]
      : []),
    ...(notFound ? [ApiResponse({ status: 404, description: notFound })] : []),
  );
}
