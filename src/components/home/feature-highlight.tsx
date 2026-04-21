"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { HighlightCard } from "@/lib/queries/highlight-cards";

type HighlightCardItemProps = {
  card: HighlightCard;
  className?: string;
};

function HighlightCardItem({ card, className }: HighlightCardItemProps) {
  return (
    <Link
      href={card.linkUrl}
      className={`relative block w-full overflow-hidden rounded-2xl${className ? ` ${className}` : ""}`}
    >
      <Image
        src={card.imageUrl}
        alt={card.title}
        fill
        className="object-cover object-center"
        sizes="(max-width: 768px) 45vw, 40vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-3 md:p-4">
        <p className="text-sm font-medium text-white md:text-base">
          {card.title}
        </p>
        <span className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-black">
          Comprar
        </span>
      </div>
    </Link>
  );
}

type FeatureHighlightProps = {
  cards: HighlightCard[];
};

export function FeatureHighlight({ cards }: FeatureHighlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(
              Number(entry.target.getAttribute("data-highlight-index")),
            );
          }
        });
      },
      { threshold: 0.6 },
    );

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  const pos1 = cards.find((c) => c.position === 1);
  const pos2 = cards.find((c) => c.position === 2);
  const pos3 = cards.find((c) => c.position === 3);

  if (!pos1 || !pos2 || !pos3) return null;

  const mobileCards = [pos1, pos2, pos3];

  return (
    <section className="px-5">
      {/* Mobile: horizontal scroll carousel — breaks out of section padding via -mx-5 */}
      <div className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-scroll scroll-smooth px-4 md:hidden">
        {mobileCards.map((card, index) => (
          <div
            key={card.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            data-highlight-index={String(index)}
            className="relative h-[420px] w-[85vw] shrink-0 snap-start overflow-hidden rounded-2xl"
          >
            <Link href={card.linkUrl} className="relative block h-full w-full">
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover object-center"
                sizes="85vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-3">
                <p className="line-clamp-2 text-base font-medium leading-snug text-white">
                  {card.title}
                </p>
                <span className="ml-2 shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-medium text-black">
                  Comprar
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dots — mobile only */}
      <div className="mt-3 flex justify-center gap-2 md:hidden">
        {mobileCards.map((_, i) => (
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

      {/* Desktop: original 1x2 grid layout — intocável */}
      <div className="hidden md:grid md:h-[580px] md:grid-cols-2 md:gap-3">
        <div className="flex flex-col gap-3">
          <HighlightCardItem card={pos1} className="min-h-0 flex-1" />
          <HighlightCardItem card={pos2} className="min-h-0 flex-1" />
        </div>
        <HighlightCardItem card={pos3} className="h-full" />
      </div>
    </section>
  );
}
