export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="border-brand h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}
