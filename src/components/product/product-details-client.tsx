"use client";

import { useMemo } from "react";

import { formatCentsToBRL } from "@/helpers/money";
import { useVariantSelector } from "@/hooks/use-variant-selector";
import {
  getPreferredVariant,
  type ProductSizeModel,
  type ProductSizeType,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";
import type { SizeChartRange } from "@/lib/size-chart-schema";

import { ShippingCalculator } from "../shipping/shipping-calculator";
import ProductActions from "./product-actions";
import { ProductGallery } from "./product-gallery";
import { SizeRecommenderModal } from "./size-recommender-modal";
import VariantSelector from "./variant-selector";
import { WishlistButton } from "./wishlist-button";

type ProductDetailsClientProps = {
  categoryName: string;
  initialVariantSlug?: string;
  initialIsWishlisted: boolean;
  productId: string;
  productDescription: string;
  productName: string;
  productBrand?: string | null;
  videoUrl?: string | null;
  sizeChart: SizeChartRange[];
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variants: ProductVariantModel[];
};

const ProductDetailsClient = ({
  categoryName,
  initialVariantSlug,
  initialIsWishlisted,
  productId,
  productDescription,
  productName,
  productBrand,
  videoUrl,
  sizeChart,
  sizeType,
  productSizes,
  variants,
}: ProductDetailsClientProps) => {
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
        <div>
          <h1 className="text-xl font-semibold">{productName}</h1>
          {productBrand && (
            <p className="text-muted-foreground mt-0.5 text-sm">{productBrand}</p>
          )}
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
        />

        {/* Description */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {productDescription}
          </p>
        </div>

        {/* Shipping calculator */}
        <ShippingCalculator productId={productId} quantity={1} />
      </div>
    </div>
  );
};

export default ProductDetailsClient;
