"use client";

import { formatCentsToBRL } from "@/helpers/money";
import { useVariantSelector } from "@/hooks/use-variant-selector";
import {
  getPreferredVariant,
  productVariantListSchema,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";

import ProductActions from "./product-actions";
import ProductImage from "./product-image";
import VariantSelector from "./variant-selector";

type ProductDetailsClientProps = {
  initialVariantSlug?: string;
  productDescription: string;
  productName: string;
  variants: ProductVariantModel[];
};

const ProductDetailsClient = ({
  initialVariantSlug,
  productDescription,
  productName,
  variants,
}: ProductDetailsClientProps) => {
  const parsedVariants = productVariantListSchema.parse(variants);
  const {
    colorOptions,
    displayImageUrl,
    isSelectedVariantAvailable,
    selectedColor,
    selectedSize,
    selectedVariant,
    selectColor,
    selectSize,
    sizeOptions,
  } = useVariantSelector({
    initialVariantSlug,
    variants: parsedVariants,
  });

  const fallbackVariant = getPreferredVariant(parsedVariants);
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

      <VariantSelector
        colorOptions={colorOptions}
        sizeOptions={sizeOptions}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onColorSelect={selectColor}
        onSizeSelect={selectSize}
      />

      <div className="space-y-2 px-5">
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

      <ProductActions
        isSelectedVariantAvailable={isSelectedVariantAvailable}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        selectedVariant={selectedVariant}
      />

      <div className="px-5">
        <p className="text-shadow-amber-600">{productDescription}</p>
      </div>
    </div>
  );
};

export default ProductDetailsClient;

