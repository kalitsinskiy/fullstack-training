import { Link } from 'react-router-dom';
import { Gift, Users, Shuffle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-6 text-center">
      <section className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Gift className="size-10 text-primary" />
          <h1 className="font-display text-4xl font-bold text-foreground">Secret Santa</h1>
        </div>
        <p className="max-w-md text-lg text-muted-foreground">
          Organize your gift exchange effortlessly. Create a room, invite friends, draw names, and
          share wishlists — all in one place.
        </p>
        <div className="mt-4 flex gap-3">
          <Button size="lg" asChild>
            <Link to="/register">Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="grid max-w-2xl gap-6 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2">
          <Users className="size-8 text-primary" />
          <h3 className="font-semibold">Create rooms</h3>
          <p className="text-sm text-muted-foreground">Invite participants with a simple code</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Shuffle className="size-8 text-primary" />
          <h3 className="font-semibold">Draw names</h3>
          <p className="text-sm text-muted-foreground">Random and fair assignment for everyone</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ListChecks className="size-8 text-primary" />
          <h3 className="font-semibold">Share wishlists</h3>
          <p className="text-sm text-muted-foreground">Know exactly what your person wants</p>
        </div>
      </section>
    </div>
  );
}
