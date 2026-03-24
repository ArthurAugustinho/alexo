import Image from "next/image";
import Link from "next/link";

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
  const pos1 = cards.find((c) => c.position === 1);
  const pos2 = cards.find((c) => c.position === 2);
  const pos3 = cards.find((c) => c.position === 3);

  if (!pos1 || !pos2 || !pos3) return null;

  return (
    <section className="px-5">
      <div className="grid h-[480px] grid-cols-2 gap-3 md:h-[580px]">
        <div className="flex flex-col gap-3">
          <HighlightCardItem card={pos1} className="min-h-0 flex-1" />
          <HighlightCardItem card={pos2} className="min-h-0 flex-1" />
        </div>
        <HighlightCardItem card={pos3} className="h-full" />
      </div>
    </section>
  );
}
