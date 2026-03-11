import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { productVariantTable } from "@/db/schema";

interface LegacyProductVariantPageProps {
  params: Promise<{ slug: string }>;
}

const LegacyProductVariantPage = async ({
  params,
}: LegacyProductVariantPageProps) => {
  const { slug } = await params;

  const productVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.slug, slug),
    with: {
      product: true,
    },
  });

  if (!productVariant) {
    return notFound();
  }

  redirect(`/product/${productVariant.product.slug}?variant=${productVariant.slug}`);
};

export default LegacyProductVariantPage;
