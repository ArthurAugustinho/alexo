import Image from "next/image";
import Link from "next/link";

import { productImageTable, productTable, productVariantTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";
import { getPreferredVariant } from "@/lib/product-variant-schema";
import { cn } from "@/lib/utils";

interface ProductItemProps {
  product: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
    images?: (typeof productImageTable.$inferSelect)[];
  };
  textContainerClassName?: string;
}

const ProductItem = ({ product, textContainerClassName }: ProductItemProps) => {
  const firstVariant = getPreferredVariant(product.variants);

  if (!firstVariant) {
    return null;
  }

  const imageUrl = product.images?.[0]?.url ?? firstVariant.imageUrl;

  return (
    <Link
      href={`/product/${product.slug}?variant=${firstVariant.slug}`}
      className="flex flex-col gap-4"
    >
      <Image
        src={imageUrl}
        alt={firstVariant.name}
        sizes="100vw"
        height={0}
        width={0}
        className="h-auto w-full rounded-3xl"
      />
      <div
        className={cn(
          "flex max-w-[200px] flex-col gap-1",
          textContainerClassName,
        )}
      >
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-muted-foreground truncate text-xs font-medium">
          {product.description}
        </p>
        <p className="truncate text-sm font-semibold">
          {formatCentsToBRL(firstVariant.priceInCents)}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
