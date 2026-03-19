import { eq } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";

import { db } from "@/db";
import { productVariantTable } from "@/db/schema";

interface ProductVariantPageProps {
  params: Promise<{ slug: string }>;
}

const ProductVariantPage = async ({ params }: ProductVariantPageProps) => {
  const { slug } = await params;
  const productVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.slug, slug),
    with: {
      product: {
        columns: {
          slug: true,
        },
      },
    },
  });

  if (!productVariant) {
    return notFound();
  }

  return permanentRedirect(
    `/product/${productVariant.product.slug}?variant=${productVariant.slug}`,
  );
};

export default ProductVariantPage;
