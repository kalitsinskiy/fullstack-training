export function PageSpinner() {
  return (
    <div className="grid min-h-svh place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}
