import { Link } from 'react-router-dom';
import { Gift, ListChecks, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Sparkles, title: 'Fair draw', text: 'No one ever draws themselves.' },
  {
    icon: ListChecks,
    title: 'Wishlists',
    text: 'Tell your Santa exactly what you want.',
  },
  {
    icon: Gift,
    title: 'Anonymous chat',
    text: 'Message your match without showing who you are.',
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Gift className="size-6 text-primary" />
          <span className="font-display text-lg font-bold">Secret Santa</span>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary-soft">
          <img src="/decor/santa-hat.svg" alt="" className="size-12" />
        </span>
        <h1 className="max-w-2xl font-display text-4xl font-bold sm:text-5xl">
          Secret Santa
        </h1>
        <p className="max-w-md text-muted-foreground">
          Create a room, invite friends, draw names fairly, share wishlists, and
          chat anonymously with your match — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/register">Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        <ul className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-lg border border-border bg-card p-5 text-left"
            >
              <Icon className="mb-2 size-6 text-primary" />
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
