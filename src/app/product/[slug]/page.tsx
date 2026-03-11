import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import ProductList from "@/components/common/product-list";
import { db } from "@/db";
import { productTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";

import ProductActions from "@/app/product-variant/[slug]/components/product-actions";
import VariantSelector from "@/app/product-variant/[slug]/components/variant-selector";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}

const ProductPage = async ({ params, searchParams }: ProductPageProps) => {
  const [{ slug }, { variant: variantSlug }] = await Promise.all([
    params,
    searchParams,
  ]);

  const product = await db.query.productTable.findFirst({
    where: eq(productTable.slug, slug),
    with: {
      variants: true,
    },
  });

  if (!product || product.variants.length === 0) {
    return notFound();
  }

  const selectedVariant = variantSlug
    ? product.variants.find((variant) => variant.slug === variantSlug)
    : product.variants[0];

  if (!selectedVariant) {
    return notFound();
  }

  const likelyProducts = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, product.categoryId),
    with: {
      variants: true,
    },
  });

  return (
    <>
      <Header />
      <div className="flex flex-col space-y-6">
        <Image
          src={selectedVariant.imageUrl}
          alt={selectedVariant.name}
          sizes="100vw"
          height={0}
          width={0}
          className="h-auto w-full object-cover"
        />

        <div className="px-5">
          <VariantSelector
            productSlug={product.slug}
            selectedVariantSlug={selectedVariant.slug}
            variants={product.variants}
          />
        </div>

        <div className="px-5">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <h3 className="text-muted-foreground text-sm">
            {selectedVariant.name}
          </h3>
          <h3 className="text-lg font-semibold">
            {formatCentsToBRL(selectedVariant.priceInCents)}
          </h3>
        </div>

        <ProductActions productVariantId={selectedVariant.id} />

        <div className="px-5">
          <p className="text-shadow-amber-600">{product.description}</p>
        </div>

        <ProductList title="Talvez você goste" products={likelyProducts} />

        <Footer />
      </div>
    </>
  );
};

export default ProductPage;
