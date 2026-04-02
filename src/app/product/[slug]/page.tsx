import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Header } from "@/components/common/header";
import { FrequentlyBoughtCarousel } from "@/components/product/frequently-bought-carousel";
import { ProductBreadcrumb } from "@/components/product/product-breadcrumb";
import { ProductDescription } from "@/components/product/product-description";
import ProductDetailsClient from "@/components/product/product-details-client";
import { RecommendedCarousel } from "@/components/product/recommended-carousel";
import { ReviewSection } from "@/components/product/review-section";
import { SaleCarousel } from "@/components/product/sale-carousel";
import { auth } from "@/lib/auth";
import { getLogisticsConfig } from "@/lib/queries/logistics";
import { getProductBySlug } from "@/lib/queries/products";
import {
  getApprovedReviewsByProduct,
  getReviewStats,
} from "@/lib/queries/reviews";
import { getSizeChartByCategory } from "@/lib/queries/size-charts";
import { isProductInWishlist } from "@/lib/queries/wishlist";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
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
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
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

  const [product, session] = await Promise.all([
    getProductBySlug(slug),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  if (!product || product.variants.length === 0) {
    return notFound();
  }

  if (
    variantSlug &&
    !product.variants.some((variant) => variant.slug === variantSlug)
  ) {
    return notFound();
  }

  const [isWishlisted, sizeChartData, reviews, reviewStats, logisticsConfig] =
    await Promise.all([
      session?.user.id
        ? isProductInWishlist(session.user.id, product.id)
        : Promise.resolve(false),
      getSizeChartByCategory(product.categoryId),
      getApprovedReviewsByProduct(product.id),
      getReviewStats(product.id),
      getLogisticsConfig(),
    ]);

  return (
    <>
      <Header />
      <div className="flex flex-col space-y-10 py-6">
        {/* Breadcrumb */}
        <div className="px-5 lg:px-8">
          <ProductBreadcrumb
            categoryName={product.category.name}
            categorySlug={product.category.slug}
            productName={product.name}
          />
        </div>

        {/* Grid principal: galeria + detalhes */}
        <ProductDetailsClient
          categoryName={product.category.name}
          initialVariantSlug={variantSlug}
          initialIsWishlisted={isWishlisted}
          productId={product.id}
          productDescription={product.description}
          productName={product.name}
          productBrand={product.brand}
          isVerified={product.isVerified}
          videoUrl={product.videoUrl}
          sizeChart={sizeChartData?.entries ?? []}
          sizeType={product.sizeType}
          productSizes={product.productSizes}
          variants={product.variants}
          reviewStats={reviewStats}
          logisticsConfig={logisticsConfig}
          deliveryDaysMin={product.deliveryDaysMin}
          deliveryDaysMax={product.deliveryDaysMax}
          discountPercent={product.discountPercent}
          originalPriceInCents={product.originalPriceInCents}
          pixDiscountText={product.pixDiscountText}
          badgeLabel={product.badgeLabel}
          isCustomizable={product.isCustomizable ?? false}
          customizationLeadDays={product.customizationLeadDays ?? 2}
          nameFieldEnabled={product.nameFieldEnabled ?? false}
          nameFieldPriceInCents={product.nameFieldPriceInCents ?? 0}
          numberFieldEnabled={product.numberFieldEnabled ?? false}
          numberFieldPriceInCents={product.numberFieldPriceInCents ?? 0}
          patchOptions={product.patchOptions}
        />

        {/* Descrição do produto */}
        <div className="px-5 lg:px-8">
          <ProductDescription description={product.description} />
        </div>

        {/* Avaliações */}
        <div className="px-5 lg:px-8">
          <ReviewSection reviews={reviews} stats={reviewStats} />
        </div>

        {/* Carrosséis */}
        <RecommendedCarousel
          categoryId={product.categoryId}
          currentProductId={product.id}
        />
        <FrequentlyBoughtCarousel currentProductId={product.id} />
        <SaleCarousel currentProductId={product.id} />

        <div className="py-8" />
      </div>
    </>
  );
};

export default ProductPage;
