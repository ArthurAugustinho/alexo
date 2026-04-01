"use client";

import { LogOutIcon, MapPinIcon, PackageIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/hooks/queries/use-orders";
import { useProfile } from "@/hooks/queries/use-profile";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/account/profile", label: "Meu cadastro", icon: UserCircleIcon },
  { href: "/account/orders", label: "Meus pedidos", icon: PackageIcon },
  { href: "/account/addresses", label: "Meus endereços", icon: MapPinIcon },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { data: profile } = useProfile(session?.user?.id);
  const { data: orders = [] } = useOrders(session?.user?.id);

  const activeOrdersCount = orders.filter((o) =>
    ["pending", "paid", "shipped"].includes(o.status),
  ).length;

  return (
    <div className="rounded-2xl border p-2">
      {/* User info */}
      <div className="flex items-center gap-3 px-3 py-3">
        <Avatar>
          <AvatarImage
            src={profile?.image ?? session?.user?.image ?? undefined}
          />
          <AvatarFallback>
            {session?.user?.name?.split(" ")?.[0]?.[0]}
            {session?.user?.name?.split(" ")?.[1]?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {session?.user?.name}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {session?.user?.email}
          </p>
        </div>
      </div>

      <Separator className="mb-2" />

      {/* Nav items */}
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4 shrink-0" />
                {item.label}
              </span>
              {item.href === "/account/orders" && activeOrdersCount > 0 && (
                <Badge className="rounded-full px-2 py-0.5 text-xs">
                  {activeOrdersCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-2" />

      <button
        type="button"
        onClick={() => authClient.signOut()}
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
      >
        <LogOutIcon className="size-4 shrink-0" />
        Sair
      </button>
    </div>
  );
}
