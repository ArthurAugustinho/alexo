"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/queries/use-categories";

const HIDDEN_PREFIXES = ["/admin", "/authentication", "/login"];

export function CategoryNav() {
  const pathname = usePathname();
  const { data: categories, isLoading } = useCategories();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="border-b">
        <div className="flex h-10 items-center gap-6 overflow-hidden px-5 md:justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <nav className="border-b" aria-label="Categorias">
      <div className="scrollbar-hide flex h-10 items-center overflow-x-auto px-5 md:justify-center md:gap-8">
        {categories.map((category) => {
          const isActive = pathname === `/category/${category.slug}`;
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={`shrink-0 whitespace-nowrap px-3 text-[13px] transition-colors hover:text-foreground md:px-0 ${
                isActive
                  ? "font-medium text-foreground underline underline-offset-4"
                  : "text-muted-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
