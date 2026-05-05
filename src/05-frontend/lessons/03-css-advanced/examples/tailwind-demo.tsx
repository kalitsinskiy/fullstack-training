/**
 * Tailwind CSS Demo
 *
 * Demonstrates the same Button + Card pattern from styled-components-demo.tsx,
 * built with Tailwind utility classes and `clsx` for conditional combinations.
 *
 * To run:
 *   1. Set up Tailwind in a Vite project:
 *        npm install -D tailwindcss @tailwindcss/vite clsx
 *      Add `tailwindcss()` to vite.config.ts plugins.
 *      Add `@import "tailwindcss";` to src/index.css.
 *   2. Copy this file into src/, import the default export in App.tsx.
 */

import { clsx } from 'clsx';
import { useState } from 'react';

// ================================================
// 1. BUTTON — variant + size via class maps
// ================================================

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300',
  secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus-visible:ring-slate-300',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-8 py-3 text-lg',
};

function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        // base
        'rounded-md font-medium transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // variant + size
        variantClasses[variant],
        sizeClasses[size],
        // caller override
        className,
      )}
      {...rest}
    />
  );
}

// ================================================
// 2. CARD — container queries + responsive layout
// ================================================

interface RoomCardProps {
  name: string;
  code: string;
  memberCount: number;
  status: 'pending' | 'drawn' | 'closed';
  onOpen: () => void;
}

const statusBadge = {
  pending: 'bg-amber-100 text-amber-800',
  drawn:   'bg-emerald-100 text-emerald-800',
  closed:  'bg-slate-100 text-slate-600',
};

function RoomCard({ name, code, memberCount, status, onOpen }: RoomCardProps) {
  return (
    // @container marks this element as a query container.
    // The children below switch from column to row layout when the card itself is >=24rem.
    <article className="@container rounded-lg bg-white shadow-md hover:shadow-lg transition p-5">
      <div className="flex flex-col @sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900 truncate">{name}</h3>
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusBadge[status])}>
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Code: <span className="font-mono">{code}</span></p>
          <p className="text-sm text-slate-500">{memberCount} members</p>
        </div>

        <div className="flex @sm:flex-col gap-2 @sm:items-stretch">
          <Button size="sm" onClick={onOpen}>Open</Button>
        </div>
      </div>
    </article>
  );
}

// ================================================
// 3. RESPONSIVE GRID — auto-fill, no media queries
// ================================================

const rooms = [
  { id: '1', name: 'Office Party 2025', code: 'ABC123', memberCount: 8,  status: 'pending' as const },
  { id: '2', name: 'Family Exchange',   code: 'DEF456', memberCount: 5,  status: 'drawn'   as const },
  { id: '3', name: 'Friends Christmas', code: 'GHI789', memberCount: 12, status: 'pending' as const },
  { id: '4', name: 'Old Roommates',     code: 'JKL012', memberCount: 4,  status: 'closed'  as const },
];

function RoomList() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <section className="mx-auto max-w-6xl p-6 md:p-10">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Your Rooms</h2>
        <Button>Create Room</Button>
      </header>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            {...room}
            onOpen={() => setOpened(room.id)}
          />
        ))}
      </div>

      {opened && (
        <p className="mt-4 text-sm text-slate-600">
          Opened room: {rooms.find((r) => r.id === opened)?.name}
        </p>
      )}
    </section>
  );
}

// ================================================
// 4. DARK MODE — token override via CSS variables / data-attr
// ================================================
//
// In Tailwind v4, dark mode can be toggled via [data-theme="dark"] selectors
// you wire up yourself in your @theme block. Toggle with:
//
//   document.documentElement.dataset.theme = 'dark';
//
// In this demo we keep light-only for clarity.

// ================================================
// DEMO
// ================================================

export default function TailwindDemo() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Tailwind Demo</h1>
          <p className="text-slate-600">
            Same Button + Card patterns from styled-components-demo.tsx, with utility classes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Buttons</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="primary"   size="sm">Save (sm)</Button>
            <Button variant="primary"   size="md">Save (md)</Button>
            <Button variant="primary"   size="lg">Save (lg)</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="danger">Delete</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <RoomList />
      </div>
    </div>
  );
}
