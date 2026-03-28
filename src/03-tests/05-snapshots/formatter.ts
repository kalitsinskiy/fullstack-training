export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: string[];
}

export interface ReportRow {
  label: string;
  value: number | string;
}

export function formatUser(user: User): object {
  return {
    id: user.id,
    displayName: user.name,
    contactEmail: user.email,
    accessLevel: user.role,
    memberSince: user.createdAt.toISOString().split('T')[0],
    isAdmin: user.role === 'admin',
  };
}

export function formatApiError(error: ApiError): object {
  return {
    error: {
      code: error.code,
      message: error.message,
      httpStatus: error.statusCode,
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
    documentation: `https://docs.example.com/errors/${error.code}`,
  };
}

export function generateReport(title: string, rows: ReportRow[]): object {
  const total = rows
    .filter(r => typeof r.value === 'number')
    .reduce((sum, r) => sum + (r.value as number), 0);

  return {
    title,
    rows,
    summary: {
      rowCount: rows.length,
      total,
      generated: new Date().toISOString(),
    },
  };
}

export function formatUserList(users: User[]): object {
  return {
    count: users.length,
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
    })),
  };
}
