import { and, asc, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { productImageTable, productTable, productVariantTable } from "@/db/schema";

import ProductItem from "../common/product-item";

type RelatedProductsProps = {
  categoryId: string;
  excludeProductId: string;
};

export async function RelatedProducts({
  categoryId,
  excludeProductId,
}: RelatedProductsProps) {
  const products = await db.query.productTable.findMany({
    where: and(
      eq(productTable.categoryId, categoryId),
      ne(productTable.id, excludeProductId),
    ),
    with: {
      variants: {
        orderBy: [desc(productVariantTable.isAvailable)],
      },
      images: { orderBy: [asc(productImageTable.position)], limit: 1 },
    },
    limit: 4,
  });

  const productsWithVariants = products.filter(
    (product) => product.variants.length > 0,
  );

  if (productsWithVariants.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 px-5 lg:px-8">
      <h2 className="font-semibold">Você também pode gostar</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {productsWithVariants.map((product) => (
          <div key={product.id} className="w-[200px] flex-none lg:w-auto">
            <ProductItem product={product} textContainerClassName="max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
