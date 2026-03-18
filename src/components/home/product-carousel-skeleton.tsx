type ProductCarouselSkeletonProps = {
  title: string;
};

export function ProductCarouselSkeleton({
  title,
}: ProductCarouselSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 px-5">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="hidden gap-2 md:flex">
          <div className="size-10 animate-pulse rounded-full bg-muted" />
          <div className="size-10 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div
        aria-label={`Carregando ${title}`}
        className="flex gap-4 overflow-hidden px-5"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`${title}-skeleton-${index + 1}`}
            className="animate-pulse space-y-4"
          >
            <div className="h-[276px] w-[220px] rounded-[28px] bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
