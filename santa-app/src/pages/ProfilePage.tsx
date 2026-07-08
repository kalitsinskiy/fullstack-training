import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/useAuth';

export function ProfilePage() {
  const { user, logout, login } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/users/me', { displayName });
      toast.success('Display name updated');
      // Re-fetch the user profile by re-triggering the auth context
      const token = localStorage.getItem('santa.accessToken');
      if (token) await login(token);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  }

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
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display name</Label>
              <Input
                id="editDisplayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </form>
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
