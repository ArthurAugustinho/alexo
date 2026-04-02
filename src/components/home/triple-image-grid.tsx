import Image from "next/image";

import type { TripleImageGridItem } from "@/lib/queries/triple-image-grid";

type TripleImageGridProps = {
  items: TripleImageGridItem[];
};

export function TripleImageGrid({ items }: TripleImageGridProps) {
  if (items.length < 3) return null;

  const slots = items.slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-1">
      {slots.map((item) => {
        const inner = (
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={`Grade imagem ${item.position}`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="33vw"
            />
          </div>
        );

        if (item.linkUrl) {
          return (
            <a key={item.id} href={item.linkUrl} className="block">
              {inner}
            </a>
          );
        }

        return <div key={item.id}>{inner}</div>;
      })}
    </div>
  );
}
