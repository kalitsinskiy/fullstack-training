import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackLink({
  id,
  destinationText,
}: {
  id?: string;
  destinationText: string;
}) {
  return (
    <Link
      to={`/rooms/${id}`}
      className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Back to {destinationText}
    </Link>
  );
}
