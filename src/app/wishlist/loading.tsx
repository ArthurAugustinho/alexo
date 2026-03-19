import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";

export default function WishlistLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 pb-16">
        <div className="space-y-3 pt-4">
          <div className="bg-muted h-8 w-64 animate-pulse rounded-full" />
          <div className="bg-muted h-4 w-72 animate-pulse rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`wishlist-loading-card-${index}`}
              className="bg-background overflow-hidden rounded-[28px] border shadow-sm"
            >
              <div className="bg-muted aspect-[4/5] animate-pulse" />
              <div className="space-y-3 p-4">
                <div className="bg-muted h-4 w-20 animate-pulse rounded-full" />
                <div className="bg-muted h-5 w-full animate-pulse rounded-full" />
                <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
                <div className="bg-muted h-10 w-full animate-pulse rounded-full" />
                <div className="bg-muted h-10 w-full animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
