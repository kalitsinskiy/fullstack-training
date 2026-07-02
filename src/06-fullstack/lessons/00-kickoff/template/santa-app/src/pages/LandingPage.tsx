import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Public landing page — STUB.
 *
 * Build this from the Santa Figma mockup (see design/screens/).
 * The LoginPage is provided as a worked example of the patterns you'll need
 * (layout, tokens, components). Replicate that approach here: hero section,
 * feature highlights, and calls-to-action.
 *
 * TODO(you): implement the landing layout to match the Figma "Landing" frame.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex items-center gap-2">
        <Gift className="size-8 text-primary" />
        <span className="font-display text-2xl font-bold">Secret Santa</span>
      </div>
      <p className="max-w-sm text-muted-foreground">
        Landing page stub — build the hero and features from the Figma mockup.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/register">Get started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
