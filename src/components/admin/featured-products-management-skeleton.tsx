export function FeaturedProductsManagementSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <div className="animate-pulse space-y-4 rounded-3xl border p-6">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="h-8 w-64 rounded-full bg-muted" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`featured-item-${index + 1}`}
            className="h-24 rounded-3xl bg-muted"
          />
        ))}
      </div>

      <div className="animate-pulse space-y-4 rounded-3xl border p-6">
        <div className="h-4 w-24 rounded-full bg-muted" />
        <div className="h-8 w-56 rounded-full bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`search-item-${index + 1}`}
            className="h-24 rounded-3xl bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
