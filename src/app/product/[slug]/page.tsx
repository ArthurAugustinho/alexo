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

function getAppUrl() {
  const currentAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!currentAppUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return currentAppUrl;
}

const appUrl = getAppUrl();

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

  const description = truncateDescription(product.description);
  const primaryVariant = product.variants[0] ?? null;
  const canonicalUrl = `${appUrl.replace(/\/$/, "")}/product/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: primaryVariant
      ? {
          type: "website",
          title: product.name,
          description,
          url: canonicalUrl,
          images: [
            {
              url: primaryVariant.imageUrl,
              alt: product.name,
            },
          ],
        }
      : undefined,
    twitter: primaryVariant
      ? {
          card: "summary_large_image",
          title: product.name,
          description,
          images: [primaryVariant.imageUrl],
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
