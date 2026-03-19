export default function AdminProductVariantsLoading() {
  return (
    <div className="space-y-8">
      <section className="animate-pulse rounded-3xl border p-6">
        <div className="space-y-3">
          <div className="h-5 w-36 rounded-full bg-muted" />
          <div className="h-9 w-72 rounded-full bg-muted" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-muted" />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border">
        <div className="animate-pulse space-y-0">
          <div className="grid grid-cols-[120px_1fr_120px_180px_180px] gap-4 border-b bg-muted/40 px-4 py-3">
            <div className="h-4 rounded-full bg-muted-foreground/15" />
            <div className="h-4 rounded-full bg-muted-foreground/15" />
            <div className="h-4 rounded-full bg-muted-foreground/15" />
            <div className="h-4 rounded-full bg-muted-foreground/15" />
            <div className="h-4 rounded-full bg-muted-foreground/15" />
          </div>

          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={`variant-skeleton-${index + 1}`}
              className="grid grid-cols-[120px_1fr_120px_180px_180px] gap-4 border-b px-4 py-4 last:border-b-0"
            >
              <div className="h-16 rounded-2xl bg-muted" />
              <div className="h-5 rounded-full bg-muted" />
              <div className="h-5 rounded-full bg-muted" />
              <div className="h-10 rounded-full bg-muted" />
              <div className="h-10 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
