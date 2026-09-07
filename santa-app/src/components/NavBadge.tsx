export function NavBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;

  return (
    <span
      aria-label={label}
      className="absolute -top-1 -right-1 md:top-0 md:right-0 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
