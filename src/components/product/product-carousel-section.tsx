"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import type { CarouselProduct } from "@/lib/queries/products";

import { ProductCard } from "./product-card";

type ProductCarouselSectionProps = {
  title: string;
  products: CarouselProduct[];
};

export function ProductCarouselSection({
  title,
  products,
}: ProductCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(direction: "left" | "right") {
    const container = scrollRef.current;
    if (!container) return;
    const offset = Math.round(container.clientWidth * 0.85);
    container.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  }

  return (
    <section className="space-y-6 py-4">
      <div className="flex items-center justify-between gap-4 px-5 lg:px-0">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label={`Rolar ${title} para a esquerda`}
            onClick={() => scroll("left")}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label={`Rolar ${title} para a direita`}
            onClick={() => scroll("right")}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-5 pb-2 lg:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
