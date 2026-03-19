import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCentsToBRL } from "@/helpers/money";
import { type StorefrontProduct } from "@/lib/storefront-showcase-schema";

type ProductCardProps = {
  badgeLabel: string;
  product: StorefrontProduct;
};

export function ProductCard({ badgeLabel, product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}?variant=${product.variantSlug}`}
      aria-label={`Abrir produto ${product.name}`}
      className="group snap-start"
    >
      <article className="border-border/70 bg-background flex w-[220px] flex-none flex-col gap-4 rounded-[28px] border p-3 shadow-sm transition-transform duration-200 hover:-translate-y-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-muted">
          <Image
            src={product.imageUrl}
            alt={`Imagem do produto ${product.name}`}
            fill
            sizes="(max-width: 768px) 70vw, 220px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="space-y-2">
          <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {badgeLabel}
          </Badge>
          <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
          <p className="text-base font-semibold">
            {formatCentsToBRL(product.priceInCents)}
          </p>
        </div>
      </article>
    </Link>
  );
}
