import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Profile — view and edit your account.
 * TODO(lesson 02 frontend): edit display name → PATCH /api/users/me.
 */
export function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{user?.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="text-sm">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
