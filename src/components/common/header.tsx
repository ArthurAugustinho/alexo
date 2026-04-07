"use client";

import { useQuery } from "@tanstack/react-query";
import { HeartIcon, LogInIcon, LogOutIcon, MapPinIcon, MenuIcon, PackageIcon, UserCircleIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/queries/use-orders";
import { useProfile } from "@/hooks/queries/use-profile";
import { getWishlistProductIdsForCurrentUser } from "@/lib/actions/wishlist";
import { authClient } from "@/lib/auth-client";
import { italiana } from "@/lib/fonts";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Cart } from "./cart";
import { SearchBar } from "./search-bar";
import { SearchModal } from "./search-modal";

export const Header = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: wishlistProductIds = [] } = useQuery({
    queryKey: ["wishlist-product-ids", session?.user?.id],
    queryFn: () => getWishlistProductIdsForCurrentUser(),
    enabled: Boolean(session?.user?.id),
    staleTime: 30_000,
  });
  const { data: profile } = useProfile(session?.user?.id);
  const { data: orders = [] } = useOrders(session?.user?.id);
  const activeOrdersCount = orders.filter((o) =>
    ["pending", "paid", "shipped"].includes(o.status),
  ).length;
  const isProfileIncomplete =
    !!session?.user?.id &&
    (!profile?.phone || !profile?.birthDate || !profile?.gender || !profile?.cpf);

  function handleGoToWishlist() {
    setIsMenuOpen(false);
    router.push("/wishlist");
  }

  function handleOpenProfile() {
    setIsMenuOpen(false);
    router.push("/account/profile");
  }

  function handleOpenOrders() {
    setIsMenuOpen(false);
    router.push("/account/orders");
  }

  function handleOpenAddresses() {
    setIsMenuOpen(false);
    router.push("/account/addresses");
  }

  return (
    <header className="min-h-[64px] px-4 py-6 md:px-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center md:grid-cols-3">

        {/* Coluna esquerda — saudação (só logado, só desktop) */}
        <div className="flex items-center">
          {session?.user && (
            <span className="text-muted-foreground hidden items-center gap-1 text-sm md:flex">
              <UserIcon size={14} />
              Olá, {session.user.name?.split(" ")[0]}!
            </span>
          )}
        </div>

        {/* Coluna central — logo em texto */}
        <div className="flex min-w-0 justify-center overflow-hidden">
          <Link href="/">
            <span
              className={`${italiana.className} inline-flex items-start whitespace-nowrap leading-none tracking-[4px] text-[28px] md:tracking-[14px] md:text-[52px]`}
              style={{
                WebkitTextStroke: "0.6px currentColor",
              }}
            >
              A L E X O
              <span
                className="mt-1 leading-none tracking-normal text-[10px] md:mt-[4px] md:text-[16px]"
                style={{
                  WebkitTextStroke: 0,
                }}
              >
                ®
              </span>
            </span>
          </Link>
        </div>

        {/* Coluna direita — ícones */}
        <div className="flex shrink-0 items-center justify-end gap-1 md:gap-3">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="px-5">
              {session?.user ? (
                <>
                  <div className="flex justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={profile?.image ?? session.user.image ?? undefined} />
                          <AvatarFallback>
                            {session.user.name?.split(" ")?.[0]?.[0]}
                            {session.user.name?.split(" ")?.[1]?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isProfileIncomplete && (
                          <span className="absolute top-0 right-0 size-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">{session.user.name}</h3>
                        <span className="text-muted-foreground block text-xs">
                          {session.user.email}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => authClient.signOut()}
                    >
                      <LogOutIcon />
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="hover:bg-muted mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="bg-muted flex size-9 items-center justify-center rounded-full">
                        <UserCircleIcon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">Meu cadastro</span>
                    </span>
                    {isProfileIncomplete && (
                      <span className="text-xs font-medium text-amber-500">Incompleto</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenOrders}
                    className="hover:bg-muted mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="bg-muted flex size-9 items-center justify-center rounded-full">
                        <PackageIcon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">Meus pedidos</span>
                    </span>
                    {activeOrdersCount > 0 && (
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                        {activeOrdersCount}
                      </Badge>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddresses}
                    className="hover:bg-muted mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="bg-muted flex size-9 items-center justify-center rounded-full">
                        <MapPinIcon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">Meus endereços</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToWishlist}
                    className="hover:bg-muted mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="bg-muted flex size-9 items-center justify-center rounded-full">
                        <HeartIcon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">
                        Lista de desejos
                      </span>
                    </span>

                    <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                      {wishlistProductIds.length}
                    </Badge>
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Ola. Faca seu login!</h2>
                  <Button size="icon" asChild variant="outline">
                    <Link href="/authentication">
                      <LogInIcon />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <SearchModal />
        <SearchBar />
        <Cart isAuthenticated={Boolean(session?.user)} />
        </div>

      </div>
    </header>
  );
};
