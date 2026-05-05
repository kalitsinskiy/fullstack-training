/**
 * shadcn/ui Concept Example
 *
 * This is a CONCEPTUAL reference — not a runnable demo.
 *
 * In a real project you would either:
 *   1. Run `npx shadcn@latest add button card dialog input label` —
 *      the CLI generates files in src/components/ui/ that you own and edit.
 *   2. Hand-write the same patterns using Tailwind + Radix UI primitives + cva.
 *
 * The point of this file is to show what those generated files look like
 * and how they compose — without forcing you to install shadcn just to read.
 *
 * Required deps for the real version (only listed for reference):
 *   - tailwindcss
 *   - clsx + tailwind-merge       (for the `cn` helper)
 *   - class-variance-authority    (for variant maps)
 *   - @radix-ui/react-slot        (for asChild prop)
 *   - @radix-ui/react-dialog      (for the headless Dialog primitive)
 */

/* eslint-disable */
// @ts-nocheck — this file is illustrative; the actual deps aren't installed at the repo root.

import * as React from 'react';

// ================================================
// 1. cn() — merge Tailwind classes with conflict resolution
// ================================================

// Real implementation:
//   import { clsx, type ClassValue } from 'clsx';
//   import { twMerge } from 'tailwind-merge';
//   export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
//
// Why twMerge: lets a caller override `p-4` with `p-6` and the result is `p-6`,
// not `p-4 p-6` (which Tailwind would resolve unpredictably).

declare function cn(...args: any[]): string;

// ================================================
// 2. cva() — variant maps with TS types
// ================================================

// Real: import { cva, type VariantProps } from 'class-variance-authority';
declare function cva(base: string, config: any): any;
declare type VariantProps<T> = any;

// ================================================
// 3. Button — the canonical shadcn pattern
// ================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-9 rounded-md px-3',
        lg:      'h-11 rounded-md px-8',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// In real shadcn, asChild + <Slot> let you turn the Button into any element
// (e.g. <Button asChild><Link to="/x">Go</Link></Button>) while keeping the styles.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? ('Slot' as any) : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

// ================================================
// 4. Card — composition primitives
// ================================================

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

// ================================================
// 5. Composed usage — RoomCard
// ================================================

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  status: 'pending' | 'drawn' | 'closed';
}

function RoomCard({ room, onOpen }: { room: Room; onOpen: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate">{room.name}</CardTitle>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              room.status === 'pending' && 'bg-amber-100 text-amber-800',
              room.status === 'drawn' && 'bg-emerald-100 text-emerald-800',
              room.status === 'closed' && 'bg-slate-100 text-slate-600',
            )}
          >
            {room.status}
          </span>
        </div>
        <CardDescription>
          Code: <span className="font-mono">{room.code}</span> · {room.memberCount} members
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm" onClick={onOpen}>Open</Button>
      </CardFooter>
    </Card>
  );
}

// ================================================
// 6. Dialog — uses Radix UI under the hood
// ================================================

// A real shadcn Dialog wraps @radix-ui/react-dialog. The outline:
//
//   <Dialog>                                  ← Radix root
//     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
//     <DialogContent>                         ← portal + overlay + focus trap (Radix)
//       <DialogHeader>
//         <DialogTitle>Create Room</DialogTitle>
//         <DialogDescription>Give your room a name…</DialogDescription>
//       </DialogHeader>
//       <Input placeholder="Room name" />
//       <DialogFooter>
//         <Button variant="outline">Cancel</Button>
//         <Button>Create</Button>
//       </DialogFooter>
//     </DialogContent>
//   </Dialog>
//
// Radix gives you: focus trap, escape-to-close, click-outside-to-close,
// aria-* attributes, scroll lock — all the accessibility plumbing.
// shadcn provides: the Tailwind classes that make it look like the design system.

// ================================================
// THE TAKEAWAY
// ================================================
//
// 1. shadcn is NOT a library — it's a CLI that generates code into your repo.
// 2. The components are composed from: Tailwind classes + Radix UI primitives + cva + cn.
// 3. You own every line — read it, rename it, fork variants, delete what you don't use.
// 4. The trade-off is more upfront code vs MUI's `import { Button } from '@mui/material'`.
//
// For `santa-app`, either approach is fine. Pick the one that fits your team.

export { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, RoomCard };
