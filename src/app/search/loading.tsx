import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";

export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="space-y-6 px-5 py-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-56 animate-pulse rounded-full" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded-full" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="hidden w-[260px] shrink-0 md:block">
            <div className="space-y-3 rounded-3xl border border-border/70 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`filter-loading-${index}`}
                  className="bg-muted h-10 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          </aside>

          <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`search-card-loading-${index}`}
                className="space-y-3 rounded-[28px] border border-border/70 p-3"
              >
                <div className="bg-muted aspect-[4/5] animate-pulse rounded-[22px]" />
                <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
                <div className="bg-muted h-4 w-full animate-pulse rounded-full" />
                <div className="bg-muted h-4 w-24 animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
