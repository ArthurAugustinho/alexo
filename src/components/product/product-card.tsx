import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCentsToBRL } from "@/helpers/money";
import type { CarouselProduct } from "@/lib/queries/products";

type ProductCardProps = {
  product: CarouselProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}?variant=${product.variantSlug}`}
      aria-label={`Abrir produto ${product.name}`}
      className="group snap-start"
    >
      <article className="border-border/70 bg-background flex w-[220px] flex-none flex-col gap-3 rounded-[28px] border p-3 shadow-sm transition-transform duration-200 hover:-translate-y-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-gray-50">
          <Image
            src={product.imageUrl}
            alt={`Imagem do produto ${product.name}`}
            fill
            sizes="(max-width: 768px) 70vw, 220px"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {product.discountPercent && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground text-xs">
                ↓ {product.discountPercent}%
              </Badge>
            </div>
          )}
          {product.badgeLabel && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs uppercase">
                {product.badgeLabel}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
          {product.originalPriceInCents && (
            <p className="text-muted-foreground text-xs line-through">
              {formatCentsToBRL(product.originalPriceInCents)}
            </p>
          )}
          <p className="text-base font-semibold">
            {formatCentsToBRL(product.priceInCents)}
          </p>
        </div>
      </article>
    </Link>
  );
}
