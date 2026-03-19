import { HeartIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { Button } from "@/components/ui/button";
import { WishlistClearButton } from "@/components/wishlist/wishlist-clear-button";
import { WishlistItemCard } from "@/components/wishlist/wishlist-item-card";
import { auth } from "@/lib/auth";
import { getWishlistByUserId } from "@/lib/queries/wishlist";

const WishlistPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    redirect("/login");
  }

  const wishlistItems = await getWishlistByUserId(session.user.id);

  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 pb-16">
        <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              Lista de desejos ({wishlistItems.length} produtos)
            </h1>
            <p className="text-muted-foreground text-sm">
              Salve seus favoritos para acompanhar depois.
            </p>
          </div>

          {wishlistItems.length > 0 ? <WishlistClearButton /> : null}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed px-6 text-center">
            <div className="bg-muted flex size-16 items-center justify-center rounded-full">
              <HeartIcon className="text-muted-foreground size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Sua lista de desejos esta vazia
              </h2>
              <p className="text-muted-foreground text-sm">
                Explore a vitrine e favorite os produtos que voce quer guardar.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/search">Explorar produtos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {wishlistItems.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};

export default WishlistPage;
