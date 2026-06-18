interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}
export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="grid flex-1 place-items-center px-6 pt-16 pb-20">
      <div className="rounded-card bg-card border-border w-full max-w-100 border p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <span className="border-brand/30 text-brand-soft rounded-full border px-[1.1rem] py-[0.45rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
            ● Secret Santa
          </span>
        </div>
        <h2 className="from-brand-dark via-brand-warm to-gradient-end mb-8 bg-linear-to-r bg-clip-text text-center text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-transparent">
          {title}
        </h2>
        {children}
      </div>
    </main>
  );
}
