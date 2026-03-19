import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import ProductList from "@/components/common/product-list";
import ProductDetailsClient from "@/components/product/product-details-client";
import { db } from "@/db";
import { productTable } from "@/db/schema";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}

async function getProductBySlug(slug: string) {
  return db.query.productTable.findFirst({
    where: eq(productTable.slug, slug),
    with: {
      variants: true,
    },
  });
}

function truncateDescription(description: string, maxLength = 160) {
  const normalizedDescription = description.trim();

  if (normalizedDescription.length <= maxLength) {
    return normalizedDescription;
  }

  return `${normalizedDescription.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: Pick<ProductPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  const preferredVariant =
    product.variants.find((variant) => variant.isAvailable) ?? null;
  const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const canonicalUrl = baseAppUrl
    ? `${baseAppUrl}/product/${product.slug}`
    : `/product/${product.slug}`;

  return {
    title: product.name,
    description: truncateDescription(product.description),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: preferredVariant
      ? {
          title: product.name,
          description: truncateDescription(product.description),
          images: [
            {
              url: preferredVariant.imageUrl,
              alt: product.name,
            },
          ],
        }
      : undefined,
  };
}

const ProductPage = async ({ params, searchParams }: ProductPageProps) => {
  const [{ slug }, { variant: variantSlug }] = await Promise.all([
    params,
    searchParams,
  ]);

  const product = await getProductBySlug(slug);

  if (!product || product.variants.length === 0) {
    return notFound();
  }

  if (
    variantSlug &&
    !product.variants.some((variant) => variant.slug === variantSlug)
  ) {
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
        <ProductDetailsClient
          initialVariantSlug={variantSlug}
          productDescription={product.description}
          productName={product.name}
          variants={product.variants}
        />

        <ProductList title="Talvez voce goste" products={likelyProducts} />

        <Footer />
      </div>
    </>
  );
};

export default ProductPage;
