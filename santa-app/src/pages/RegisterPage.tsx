import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Registration page — STUB.
 *
 * Build this from the Santa Figma mockup ("Register" frame).
 * Mirror the LoginPage worked example: same form/validation/toast/auth
 * approach, plus a displayName field. POST /api/auth/register returns
 * { id, email, displayName, accessToken } — log the user in on success.
 *
 * TODO(you): implement the registration form (lesson fe-08 adds RHF + zod).
 */
export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Gift className="mb-2 size-8 text-primary" />
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Stub — build the form from the Figma mockup, following the LoginPage
            pattern.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
