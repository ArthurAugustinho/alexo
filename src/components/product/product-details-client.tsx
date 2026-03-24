"use client";

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
import ProductImage from "./product-image";
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

  return (
    <div className="flex flex-col space-y-6">
      <ProductImage
        imageUrl={displayImageUrl}
        productName={productName}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
      />

      <div className="flex justify-end px-5">
        <SizeRecommenderModal
          sizeChart={sizeChart}
          categoryName={categoryName}
          onSizeSelect={selectSize}
        />
      </div>

      <VariantSelector
        allSizesForColor={allSizesForColor}
        colorOptions={colorOptions}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onColorSelect={selectColor}
        onSizeSelect={selectSize}
      />

      <div className="flex items-start justify-between gap-4 px-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{productName}</h2>
          <h3 className="text-muted-foreground text-sm">
            {selectedColor && selectedSize
              ? `${selectedColor} - ${selectedSize}`
              : "Selecione cor e tamanho"}
          </h3>
          <h3 className="text-lg font-semibold">
            {formatCentsToBRL(displayedPriceInCents)}
          </h3>
        </div>

        <WishlistButton
          productId={productId}
          initialIsWishlisted={initialIsWishlisted}
        />
      </div>

      <ProductActions
        isSelectionComplete={isSelectionComplete}
        selectedVariant={selectedVariant}
      />

      <div className="px-5">
        <ShippingCalculator productId={productId} quantity={1} />
      </div>

      <div className="px-5">
        <p className="text-shadow-amber-600">{productDescription}</p>
      </div>
    </div>
  );
};

export default ProductDetailsClient;
