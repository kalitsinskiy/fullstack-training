export {};
// ============================================
// Exercise: Role-Based Access Control (RBAC)
// ============================================
// Run: npx ts-node src/04-backend/lessons/08-authentication/exercises/rbac.ts

// This exercise simulates RBAC middleware/guards without the NestJS framework.
// The patterns translate directly to NestJS guards.

// --- Types ---

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
}

interface Request {
  user?: User;
  path: string;
  method: string;
}

interface Response {
  status: number;
  body: any;
}

type NextFunction = () => Response;

type Middleware = (req: Request, next: NextFunction) => Response;

// --- Simulated users ---

const adminUser: User = { id: '1', email: 'admin@example.com', role: 'admin' };
const editorUser: User = { id: '2', email: 'editor@example.com', role: 'editor' };
const regularUser: User = { id: '3', email: 'user@example.com', role: 'user' };

// ============================================
// TODO 1: Implement the requireAuth middleware
// ============================================
// This middleware checks if the request has an authenticated user.
// - If req.user is undefined/null, return { status: 401, body: { error: 'Authentication required' } }
// - Otherwise, call next() and return its result

function requireAuth(_req: Request, _next: NextFunction): Response {
  // TODO: Rename parameters (remove _ prefix) and implement this middleware
  throw new Error('Not implemented');
}

// ============================================
// TODO 2: Implement the requireRoles factory function
// ============================================
// This function takes an array of allowed roles and returns a middleware.
// The returned middleware should:
// - Check if req.user exists — if not, return { status: 401, body: { error: 'Authentication required' } }
// - Check if req.user.role is in the allowedRoles array
//   - If yes, call next() and return its result
//   - If no, return { status: 403, body: { error: 'Forbidden: insufficient permissions' } }

function requireRoles(..._allowedRoles: string[]): Middleware {
  // TODO: Rename _allowedRoles back to allowedRoles and implement this factory function
  throw new Error('Not implemented');
}

// ============================================
// TODO 3: Implement the Permission type and requirePermissions
// ============================================
// Define a permissions map: each role has a set of allowed permissions.
// Permissions: 'rooms:create', 'rooms:read', 'rooms:update', 'rooms:delete',
//              'users:read', 'users:manage', 'wishlists:read', 'wishlists:write'
//
// Role permissions:
//   admin: all permissions
//   editor: rooms:create, rooms:read, rooms:update, users:read, wishlists:read, wishlists:write
//   user: rooms:read, users:read, wishlists:read, wishlists:write
//
// Implement requirePermissions(...permissions: string[]): Middleware
// The middleware should check if the user's role has ALL of the required permissions.

type Permission = string;

const rolePermissions: Record<string, Permission[]> = {
  // TODO: Define permissions for each role
};
// Used in TODO implementations below
void rolePermissions;

function requirePermissions(..._permissions: Permission[]): Middleware {
  // TODO: Rename _permissions back to permissions and implement this factory function
  throw new Error('Not implemented');
}

// ============================================
// TODO 4: Implement the isOwnerOrAdmin middleware factory
// ============================================
// In many apps, a user can access their own resources, or an admin can access anything.
// Implement a factory function that takes a function to extract the resource owner ID
// from the request, and returns a middleware that:
// - Allows access if user.role === 'admin'
// - Allows access if user.id === ownerId (the user owns the resource)
// - Returns 403 otherwise

function isOwnerOrAdmin(_getOwnerId: (req: Request) => string): Middleware {
  // TODO: Rename _getOwnerId back to getOwnerId and implement this factory function
  throw new Error('Not implemented');
}

// --- Test helpers ---

function simulateRequest(user: User | undefined, path: string, method: string = 'GET'): Request {
  return { user, path, method };
}

function simulateHandler(): NextFunction {
  return () => ({ status: 200, body: { message: 'Success' } });
}

// --- Tests ---

// Runs `fn` and reports PASS/FAIL/TODO. Distinguishes "not implemented yet"
// (the stub `throw new Error('Not implemented')`) from real assertion failures.
function check(label: string, expectedStatus: number, fn: () => Response): void {
  try {
    const result = fn();
    const ok = result?.status === expectedStatus;
    console.log(`${label}: ${ok ? 'PASS' : `FAIL (got ${result?.status}, expected ${expectedStatus})`}`);
  } catch (err: any) {
    if (err?.message === 'Not implemented') {
      console.log(`${label}: TODO (not implemented yet)`);
    } else {
      console.log(`${label}: FAIL (threw: ${err?.message})`);
    }
  }
}

function main(): void {
  console.log('=== RBAC Exercise ===\n');

  const handler = simulateHandler();

  // Test requireAuth
  console.log('--- requireAuth ---');
  check('With user', 200, () => requireAuth(simulateRequest(adminUser, '/rooms'), handler));
  check('Without user', 401, () => requireAuth(simulateRequest(undefined, '/rooms'), handler));

  // Test requireRoles
  console.log('\n--- requireRoles ---');
  const adminOnly = (req: Request) => requireRoles('admin')(req, handler);
  check('Admin access admin route', 200, () => adminOnly(simulateRequest(adminUser, '/admin')));
  check('User access admin route', 403, () => adminOnly(simulateRequest(regularUser, '/admin')));

  const editorOrAdmin = (req: Request) => requireRoles('admin', 'editor')(req, handler);
  check('Editor access editor route', 200, () => editorOrAdmin(simulateRequest(editorUser, '/edit')));
  check('User access editor route', 403, () => editorOrAdmin(simulateRequest(regularUser, '/edit')));

  // Test requirePermissions
  console.log('\n--- requirePermissions ---');
  const canDeleteRooms = (req: Request) => requirePermissions('rooms:delete')(req, handler);
  check('Admin delete room', 200, () => canDeleteRooms(simulateRequest(adminUser, '/rooms/1')));
  check('Editor delete room', 403, () => canDeleteRooms(simulateRequest(editorUser, '/rooms/1')));

  const canReadAndWrite = (req: Request) => requirePermissions('wishlists:read', 'wishlists:write')(req, handler);
  check('User read+write wishlists', 200, () => canReadAndWrite(simulateRequest(regularUser, '/wishlists')));

  const canManageUsers = (req: Request) => requirePermissions('users:manage')(req, handler);
  check('Editor manage users', 403, () => canManageUsers(simulateRequest(editorUser, '/users')));

  // Test isOwnerOrAdmin
  console.log('\n--- isOwnerOrAdmin ---');
  // Simulate: resource at /users/:id where the resource belongs to user '3'
  const ownerCheck = (req: Request) => isOwnerOrAdmin(() => '3')(req, handler);
  check('Owner access own resource', 200, () => ownerCheck(simulateRequest(regularUser, '/users/3')));
  check('Admin access any resource', 200, () => ownerCheck(simulateRequest(adminUser, '/users/3')));
  check('Other user access resource', 403, () => ownerCheck(simulateRequest(editorUser, '/users/3')));

  console.log('\nDone.');
}

main();
