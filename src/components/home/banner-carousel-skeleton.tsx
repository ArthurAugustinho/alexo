export function BannerCarouselSkeleton() {
  return (
    <div className="px-5">
      <div className="animate-pulse space-y-4">
        <div className="aspect-[4/3] rounded-[32px] bg-muted md:aspect-[16/9]" />
        <div className="flex items-center justify-center gap-2">
          <div className="h-2.5 w-8 rounded-full bg-muted" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
