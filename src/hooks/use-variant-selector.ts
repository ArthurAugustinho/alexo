"use client";

import { useMemo, useState } from "react";

import {
  compareProductVariantSizes,
  getPreferredVariant,
  productVariantListSchema,
  type ProductVariantModel,
  type ProductVariantSize,
} from "@/lib/product-variant-schema";

type VariantColorOption = {
  color: string;
  isAvailable: boolean;
};

type VariantSizeOption = {
  size: ProductVariantSize;
  isAvailable: boolean;
};

type UseVariantSelectorParams = {
  initialVariantSlug?: string;
  variants: ProductVariantModel[];
};

export function useVariantSelector({
  initialVariantSlug,
  variants,
}: UseVariantSelectorParams) {
  const parsedVariants = useMemo(
    () => productVariantListSchema.parse(variants),
    [variants],
  );

  const fallbackVariant = useMemo(
    () => getPreferredVariant(parsedVariants),
    [parsedVariants],
  );

  const initialVariant = useMemo(
    () =>
      initialVariantSlug
        ? parsedVariants.find((variant) => variant.slug === initialVariantSlug) ??
          null
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
            (variant) => variant.color === color && variant.isAvailable,
          ),
        })),
    [parsedVariants],
  );

  const sizeOptions = useMemo<VariantSizeOption[]>(() => {
    const scopedVariants = selectedColor
      ? parsedVariants.filter((variant) => variant.color === selectedColor)
      : parsedVariants;

    return Array.from(new Set(scopedVariants.map((variant) => variant.size)))
      .sort(compareProductVariantSizes)
      .map((size) => ({
        size,
        isAvailable: scopedVariants.some(
          (variant) => variant.size === size && variant.isAvailable,
        ),
      }));
  }, [parsedVariants, selectedColor]);

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

  const displayImageUrl = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.imageUrl;
    }

    if (selectedColor) {
      return (
        parsedVariants.find((variant) => variant.color === selectedColor)
          ?.imageUrl ?? initialVariant?.imageUrl ?? fallbackVariant?.imageUrl ?? ""
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

  function selectSize(size: ProductVariantSize) {
    const nextSize = sizeOptions.find((sizeOption) => sizeOption.size === size);

    if (!nextSize?.isAvailable) {
      return;
    }

    setSelectedSize(size);
  }

  return {
    colorOptions,
    displayImageUrl,
    isSelectedVariantAvailable: selectedVariant?.isAvailable ?? false,
    selectedColor,
    selectedSize,
    selectedVariant,
    selectColor,
    selectSize,
    sizeOptions,
  };
}
