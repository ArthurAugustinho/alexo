"use client";

import { useMemo, useState } from "react";

import { formatCentsToBRL } from "@/helpers/money";
import { useVariantSelector } from "@/hooks/use-variant-selector";
import {
  getPreferredVariant,
  type ProductSizeModel,
  type ProductSizeType,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";
import type { LogisticsConfig } from "@/lib/queries/logistics";
import type { ReviewStats, ReviewWithUser } from "@/lib/queries/reviews";
import { type ShippingOption } from "@/lib/shipping-schema";
import type { SizeChartRange } from "@/lib/size-chart-schema";

import { ShippingCalculator } from "../shipping/shipping-calculator";
import { LogisticsBlock } from "./logistics-block";
import ProductActions from "./product-actions";
import { ProductGallery } from "./product-gallery";
import { ReviewSection } from "./review-section";
import { SizeRecommenderModal } from "./size-recommender-modal";
import VariantSelector from "./variant-selector";
import { VerifiedBadge } from "./verified-badge";
import { WishlistButton } from "./wishlist-button";

type ProductDetailsClientProps = {
  categoryName: string;
  initialVariantSlug?: string;
  initialIsWishlisted: boolean;
  productId: string;
  productDescription: string;
  productName: string;
  productBrand?: string | null;
  isVerified: boolean;
  videoUrl?: string | null;
  sizeChart: SizeChartRange[];
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variants: ProductVariantModel[];
  reviews: ReviewWithUser[];
  reviewStats: ReviewStats;
  isLoggedIn: boolean;
  hasAlreadyReviewed: boolean;
  logisticsConfig: LogisticsConfig | null;
  deliveryDaysMin?: number | null;
  deliveryDaysMax?: number | null;
};

const ProductDetailsClient = ({
  categoryName,
  initialVariantSlug,
  initialIsWishlisted,
  productId,
  productDescription,
  productName,
  productBrand,
  isVerified,
  videoUrl,
  sizeChart,
  sizeType,
  productSizes,
  variants,
  reviews,
  reviewStats,
  isLoggedIn,
  hasAlreadyReviewed,
  logisticsConfig,
  deliveryDaysMin,
  deliveryDaysMax,
}: ProductDetailsClientProps) => {
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);

  const {
    allSizesForColor,
    colorOptions,
    displayImageUrl,
    isSelectionComplete,
    selectedColor,
    selectedSize,
    selectedVariant,
    selectColor,
    selectSize,
  } = useVariantSelector({
    initialVariantSlug,
    variants,
    sizeType,
    productSizes,
  });

  const fallbackVariant = getPreferredVariant(variants);
  const displayedPriceInCents =
    selectedVariant?.priceInCents ?? fallbackVariant?.priceInCents ?? 0;

  // Deduplicated list of unique variant images (one per color)
  const allImages = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const variant of variants) {
      if (!seen.has(variant.imageUrl)) {
        seen.add(variant.imageUrl);
        result.push(variant.imageUrl);
      }
    }
    return result;
  }, [variants]);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:px-8">
      {/* Gallery: occupies the first column on desktop, full-width on mobile */}
      <ProductGallery
        images={allImages}
        videoUrl={videoUrl}
        productName={productName}
        activeImageUrl={displayImageUrl}
      />

      {/* Info panel */}
      <div className="mt-6 space-y-5 px-5 lg:mt-0 lg:px-0">
        {/* Name & brand */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{productName}</h1>
          {productBrand && (
            <p className="text-muted-foreground text-sm">{productBrand}</p>
          )}
          <VerifiedBadge isVerified={isVerified} />
        </div>

        {/* Price + Wishlist */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-bold">
            {formatCentsToBRL(displayedPriceInCents)}
          </p>
          <WishlistButton
            productId={productId}
            initialIsWishlisted={initialIsWishlisted}
          />
        </div>

        {/* Color + Size selectors */}
        <VariantSelector
          allSizesForColor={allSizesForColor}
          colorOptions={colorOptions}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          onColorSelect={selectColor}
          onSizeSelect={selectSize}
        />

        {/* Size recommender */}
        <div className="flex justify-end">
          <SizeRecommenderModal
            sizeChart={sizeChart}
            categoryName={categoryName}
            onSizeSelect={selectSize}
          />
        </div>

        {/* Selected variant label */}
        {(selectedColor ?? selectedSize) && (
          <p className="text-muted-foreground text-sm">
            {selectedColor && selectedSize
              ? `${selectedColor} — ${selectedSize}`
              : selectedColor ?? selectedSize}
          </p>
        )}

        {/* Quantity + Add to cart + Buy now */}
        <ProductActions
          isSelectionComplete={isSelectionComplete}
          selectedVariant={selectedVariant}
          selectedShipping={selectedShipping}
        />

        {/* Description */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {productDescription}
          </p>
        </div>

        {/* Delivery time */}
        {(deliveryDaysMin != null || deliveryDaysMax != null) && (
          <p className="text-muted-foreground text-sm">
            {deliveryDaysMin != null && deliveryDaysMax != null
              ? `Prazo de entrega: ${deliveryDaysMin}–${deliveryDaysMax} dias úteis`
              : deliveryDaysMin != null
                ? `Prazo de entrega: a partir de ${deliveryDaysMin} dias úteis`
                : `Prazo de entrega: até ${deliveryDaysMax} dias úteis`}
          </p>
        )}

        {/* Shipping calculator */}
        <ShippingCalculator
          productId={productId}
          quantity={1}
          selectedOptionId={selectedShipping?.id ?? null}
          onOptionSelect={setSelectedShipping}
        />

        {/* Logistics block */}
        {logisticsConfig && (
          <LogisticsBlock
            config={logisticsConfig}
            priceInCents={displayedPriceInCents}
          />
        )}
      </div>

      {/* Reviews — full width below the 2-column grid */}
      <div className="col-span-full mt-8 border-t px-5 pt-8 lg:px-0">
        <ReviewSection
          productId={productId}
          reviews={reviews}
          stats={reviewStats}
          isLoggedIn={isLoggedIn}
          hasAlreadyReviewed={hasAlreadyReviewed}
        />
      </div>
    </div>
  );
};

export default ProductDetailsClient;
