import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import type { User } from '@/types/api';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/users';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: { displayName: user?.displayName ?? '' },
  });

  async function onSubmit(input: UpdateProfileInput) {
    try {
      const { data } = await api.patch<User>('/api/users/me', input);

      updateUser(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update your profile'));
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Display name"
              {...register('displayName')}
              error={errors.displayName?.message}
            />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
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
