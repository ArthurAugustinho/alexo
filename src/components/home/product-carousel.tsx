"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { type StorefrontProduct } from "@/lib/storefront-showcase-schema";

import { ProductCard } from "./product-card";

type ProductCarouselProps = {
  ariaLabel: string;
  badgeLabel: string;
  emptyMessage: string;
  products: StorefrontProduct[];
  title: string;
};

export function ProductCarousel({
  ariaLabel,
  badgeLabel,
  emptyMessage,
  products,
  title,
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function scrollProducts(direction: "left" | "right") {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const scrollOffset = Math.round(container.clientWidth * 0.85);

    container.scrollBy({
      left: direction === "left" ? -scrollOffset : scrollOffset,
      behavior: "smooth",
    });
  }

  return (
    <section role="region" aria-label={ariaLabel} className="space-y-6">
      <div className="flex items-center justify-between gap-4 px-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
            Vitrine
          </p>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        {products.length > 0 ? (
          <div className="hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={`Rolar ${title} para a esquerda`}
              onClick={() => scrollProducts("left")}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={`Rolar ${title} para a direita`}
              onClick={() => scrollProducts("right")}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="px-5">
          <div className="border-border/70 bg-background rounded-[28px] border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              badgeLabel={badgeLabel}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  );
}
