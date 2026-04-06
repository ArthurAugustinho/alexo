"use client";

import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import type { PatchOption } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";
import { useVariantSelector } from "@/hooks/use-variant-selector";
import {
  getPreferredVariant,
  type ProductSizeModel,
  type ProductSizeType,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";
import type { LogisticsConfig } from "@/lib/queries/logistics";
import type { ReviewStats } from "@/lib/queries/reviews";
import { type ShippingOption } from "@/lib/shipping-schema";
import type { SizeChartRange } from "@/lib/size-chart-schema";

import { ShippingCalculator } from "../shipping/shipping-calculator";
import { LogisticsBlock } from "./logistics-block";
import ProductActions from "./product-actions";
import { type CustomizationData,ProductCustomization } from "./product-customization";
import { ProductGallery } from "./product-gallery";
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
  productImages?: Array<{ url: string; alt?: string | null }>;
  sizeChart: SizeChartRange[];
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variants: ProductVariantModel[];
  reviewStats: ReviewStats;
  logisticsConfig: LogisticsConfig | null;
  deliveryDaysMin?: number | null;
  deliveryDaysMax?: number | null;
  // Discount
  discountPercent?: number | null;
  originalPriceInCents?: number | null;
  pixDiscountText?: string | null;
  badgeLabel?: string | null;
  // Customization
  isCustomizable?: boolean;
  customizationLeadDays?: number;
  nameFieldEnabled?: boolean;
  nameFieldPriceInCents?: number;
  numberFieldEnabled?: boolean;
  numberFieldPriceInCents?: number;
  patchOptions?: PatchOption[] | null;
};

const ProductDetailsClient = ({
  categoryName,
  initialVariantSlug,
  initialIsWishlisted,
  productId,
  productDescription: _productDescription,
  productName,
  productBrand,
  isVerified,
  videoUrl,
  productImages,
  sizeChart,
  sizeType,
  productSizes,
  variants,
  reviewStats,
  logisticsConfig,
  deliveryDaysMin,
  deliveryDaysMax,
  discountPercent,
  originalPriceInCents,
  pixDiscountText,
  badgeLabel,
  isCustomizable = false,
  customizationLeadDays = 2,
  nameFieldEnabled = false,
  nameFieldPriceInCents = 0,
  numberFieldEnabled = false,
  numberFieldPriceInCents = 0,
  patchOptions,
}: ProductDetailsClientProps) => {
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [customizationData, setCustomizationData] =
    useState<CustomizationData | null>(null);

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
  const basePrice =
    selectedVariant?.priceInCents ?? fallbackVariant?.priceInCents ?? 0;

  const allImages = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    // Product-level images first (from product_images table)
    if (productImages) {
      for (const img of productImages) {
        if (!seen.has(img.url)) {
          seen.add(img.url);
          result.push(img.url);
        }
      }
    }
    // Then variant images
    for (const variant of variants) {
      if (!seen.has(variant.imageUrl)) {
        seen.add(variant.imageUrl);
        result.push(variant.imageUrl);
      }
    }
    return result;
  }, [productImages, variants]);

  const handleCustomizationChange = useCallback(
    (data: CustomizationData) => {
      setCustomizationData(data);
    },
    [],
  );

  const patches = patchOptions ?? [];
  const nameField = nameFieldEnabled
    ? { enabled: true, priceInCents: nameFieldPriceInCents }
    : null;
  const numberField = numberFieldEnabled
    ? { enabled: true, priceInCents: numberFieldPriceInCents }
    : null;

  const skuCode = `#${productId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-8 lg:px-8">
      {/* Gallery column — sticky on desktop */}
      <div className="lg:self-start lg:sticky lg:top-4">
        <ProductGallery
          images={allImages}
          videoUrl={videoUrl}
          productName={productName}
          activeImageUrl={displayImageUrl}
        />
      </div>

      {/* Info panel */}
      <div className="mt-6 space-y-4 px-5 lg:mt-0 lg:px-0">
        {/* Badges */}
        {(discountPercent || badgeLabel || isCustomizable) && (
          <div className="flex flex-wrap items-center gap-2">
            {discountPercent && (
              <Badge className="bg-primary text-primary-foreground">
                -{discountPercent}% OFF
              </Badge>
            )}
            {badgeLabel && (
              <Badge variant="outline" className="font-semibold uppercase">
                {badgeLabel}
              </Badge>
            )}
            {isCustomizable && (
              <Badge variant="secondary">PERSONALIZE</Badge>
            )}
          </div>
        )}

        {/* Star rating */}
        {reviewStats.total > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(reviewStats.average)} size="sm" />
            <span className="text-muted-foreground text-sm">
              ({reviewStats.total}{" "}
              {reviewStats.total === 1 ? "avaliação" : "avaliações"})
            </span>
          </div>
        )}

        {/* Name & brand */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{productName}</h1>
          {productBrand && (
            <p className="text-muted-foreground text-sm">{productBrand}</p>
          )}
          <VerifiedBadge isVerified={isVerified} />
        </div>

        {/* Price + Wishlist */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            {originalPriceInCents && (
              <p className="text-muted-foreground text-sm line-through">
                {formatCentsToBRL(originalPriceInCents)}
              </p>
            )}
            <p className="text-2xl font-bold">
              {formatCentsToBRL(basePrice)}
            </p>
            {pixDiscountText && (
              <p className="text-muted-foreground text-xs">{pixDiscountText}</p>
            )}
          </div>
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
              : (selectedColor ?? selectedSize)}
          </p>
        )}

        {/* Customization */}
        {isCustomizable && (
          <ProductCustomization
            isCustomizable={isCustomizable}
            leadDays={customizationLeadDays}
            nameField={nameField}
            numberField={numberField}
            patches={patches}
            basePriceInCents={basePrice}
            onChange={handleCustomizationChange}
          />
        )}

        {/* Quantity + Add to cart + Buy now */}
        <ProductActions
          isSelectionComplete={isSelectionComplete}
          selectedVariant={selectedVariant}
          selectedShipping={selectedShipping}
          customizationData={customizationData}
        />

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
        <div id="shipping-calculator">
          <ShippingCalculator
            productId={productId}
            quantity={1}
            selectedOptionId={selectedShipping?.id ?? null}
            onOptionSelect={setSelectedShipping}
          />
        </div>

        {/* Logistics block */}
        {logisticsConfig && (
          <LogisticsBlock
            config={logisticsConfig}
            priceInCents={basePrice}
          />
        )}

        {/* SKU */}
        <p className="text-muted-foreground text-xs">
          Código:{" "}
          <span className="font-mono">{skuCode}</span>
        </p>
      </div>
    </div>
  );
};

export default ProductDetailsClient;
