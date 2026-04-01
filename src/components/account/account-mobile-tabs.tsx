"use client";

import { MapPinIcon, PackageIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/account/profile", label: "Cadastro", icon: UserCircleIcon },
  { href: "/account/orders", label: "Pedidos", icon: PackageIcon },
  { href: "/account/addresses", label: "Endereços", icon: MapPinIcon },
];

export function AccountMobileTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex overflow-hidden rounded-xl border">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
