"use client";

import { useMemo, useState } from "react";

import {
  getPreferredVariant,
  PRODUCT_VARIANT_SIZE_VALUES,
  productSizeListSchema,
  type ProductSizeModel,
  type ProductSizeType,
  productVariantListSchema,
  type ProductVariantModel,
  type ProductVariantSize,
} from "@/lib/product-variant-schema";

type VariantColorOption = {
  color: string;
  isAvailable: boolean;
};

type VariantSizeOption = {
  sizeValue: ProductVariantSize;
  stock: number;
  isAvailable: boolean;
  variantId: string | null;
};

type UseVariantSelectorParams = {
  initialVariantSlug?: string;
  variants: ProductVariantModel[];
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
};

export function useVariantSelector({
  initialVariantSlug,
  variants,
  sizeType,
  productSizes,
}: UseVariantSelectorParams) {
  const parsedVariants = useMemo(
    () => productVariantListSchema.parse(variants),
    [variants],
  );
  const parsedProductSizes = useMemo(
    () => productSizeListSchema.parse(productSizes),
    [productSizes],
  );

  const fallbackVariant = useMemo(
    () => getPreferredVariant(parsedVariants),
    [parsedVariants],
  );

  const initialVariant = useMemo(
    () =>
      initialVariantSlug
        ? (parsedVariants.find(
            (variant) => variant.slug === initialVariantSlug,
          ) ?? null)
        : null,
    [initialVariantSlug, parsedVariants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialVariant?.color ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<ProductVariantSize | null>(
    initialVariant?.size ?? null,
  );

  const colorOptions = useMemo<VariantColorOption[]>(
    () =>
      Array.from(new Set(parsedVariants.map((variant) => variant.color)))
        .sort((firstColor, secondColor) =>
          firstColor.localeCompare(secondColor, "pt-BR", {
            sensitivity: "base",
          }),
        )
        .map((color) => ({
          color,
          isAvailable: parsedVariants.some(
            (variant) => variant.color === color && variant.stock > 0,
          ),
        })),
    [parsedVariants],
  );

  const baseSizes = useMemo<ProductVariantSize[]>(() => {
    if (sizeType === "numeric") {
      return parsedProductSizes.map((productSize) => productSize.sizeValue);
    }

    return [...PRODUCT_VARIANT_SIZE_VALUES];
  }, [parsedProductSizes, sizeType]);

  const allSizesForColor = useMemo<VariantSizeOption[]>(() => {
    const scopedVariants = selectedColor
      ? parsedVariants.filter((variant) => variant.color === selectedColor)
      : parsedVariants;

    return baseSizes.map((sizeValue) => {
      const matchingVariants = scopedVariants.filter(
        (variant) => variant.size === sizeValue,
      );
      const preferredVariant = getPreferredVariant(matchingVariants);
      const stock = preferredVariant?.stock ?? 0;

      return {
        sizeValue,
        stock,
        isAvailable: stock > 0,
        variantId: preferredVariant?.id ?? null,
      };
    });
  }, [baseSizes, parsedVariants, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) {
      return null;
    }

    return (
      parsedVariants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize,
      ) ?? null
    );
  }, [parsedVariants, selectedColor, selectedSize]);

  const isSelectionComplete = useMemo(
    () => Boolean(selectedColor && selectedSize && (selectedVariant?.stock ?? 0) > 0),
    [selectedColor, selectedSize, selectedVariant?.stock],
  );

  const displayImageUrl = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.imageUrl;
    }

    if (selectedColor) {
      return (
        parsedVariants.find((variant) => variant.color === selectedColor)
          ?.imageUrl ??
        initialVariant?.imageUrl ??
        fallbackVariant?.imageUrl ??
        ""
      );
    }

    return initialVariant?.imageUrl ?? fallbackVariant?.imageUrl ?? "";
  }, [
    fallbackVariant?.imageUrl,
    initialVariant?.imageUrl,
    parsedVariants,
    selectedColor,
    selectedVariant,
  ]);

  function selectColor(color: string) {
    const nextColor = colorOptions.find(
      (colorOption) => colorOption.color === color,
    );

    if (!nextColor?.isAvailable) {
      return;
    }

    setSelectedColor(color);
    setSelectedSize(null);
  }

  function selectSize(sizeValue: ProductVariantSize) {
    const nextSize = allSizesForColor.find(
      (sizeOption) => sizeOption.sizeValue === sizeValue,
    );

    if (!nextSize) {
      return;
    }

    setSelectedSize(sizeValue);
  }

  return {
    allSizesForColor,
    colorOptions,
    displayImageUrl,
    isSelectionComplete,
    selectedColor,
    selectedSize,
    selectedVariant,
    selectColor,
    selectSize,
  };
}
