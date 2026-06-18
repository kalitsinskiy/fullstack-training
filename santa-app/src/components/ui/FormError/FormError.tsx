import { Alert, AlertDescription } from '../alert';

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <Alert variant="destructive" role="alert" className="my-3">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
