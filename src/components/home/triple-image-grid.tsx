"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { TripleImageGridItem } from "@/lib/queries/triple-image-grid";

type TripleImageGridProps = {
  items: TripleImageGridItem[];
};

const CARD_CLASS =
  "relative aspect-square w-[80vw] shrink-0 snap-start overflow-hidden md:w-auto";

export function TripleImageGrid({ items }: TripleImageGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-grid-item]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.getAttribute("data-grid-index")));
          }
        });
      },
      { threshold: 0.6 },
    );

    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (items.length < 3) return null;

  const slots = items.slice(0, 3);

  return (
    <>
      <div
        ref={containerRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-scroll scroll-smooth px-4 md:grid md:grid-cols-3 md:gap-1 md:overflow-visible md:px-0"
      >
        {slots.map((item, index) => {
          const imageEl = (
            <Image
              src={item.imageUrl}
              alt={`Grade imagem ${item.position}`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 80vw, 33vw"
            />
          );

          if (item.linkUrl) {
            return (
              <a
                key={item.id}
                href={item.linkUrl}
                data-grid-item=""
                data-grid-index={String(index)}
                className={CARD_CLASS}
              >
                {imageEl}
              </a>
            );
          }

          return (
            <div
              key={item.id}
              data-grid-item=""
              data-grid-index={String(index)}
              className={CARD_CLASS}
            >
              {imageEl}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-2 md:hidden">
        {slots.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === i
                ? "w-6 bg-foreground"
                : "w-1.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </>
  );
}
