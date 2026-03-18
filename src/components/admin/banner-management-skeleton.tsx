export function BannerManagementSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-muted" />
          <div className="h-8 w-56 rounded-full bg-muted" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted" />
      </div>

      <div className="overflow-hidden rounded-3xl border">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1fr] gap-4 bg-muted/50 px-4 py-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={`banner-head-${index + 1}`} className="h-4 rounded-full bg-muted" />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`banner-row-${index + 1}`}
            className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_1fr] gap-4 border-t px-4 py-4"
          >
            {Array.from({ length: 6 }, (_, cellIndex) => (
              <div
                key={`banner-cell-${index + 1}-${cellIndex + 1}`}
                className="h-14 rounded-2xl bg-muted"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
