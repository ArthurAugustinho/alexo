"use client";

import { useEffect, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getColorHex } from "@/lib/color-map";
import { type ProductVariantSize } from "@/lib/product-variant-schema";
import { cn } from "@/lib/utils";

type VariantSelectorProps = {
  colorOptions: Array<{
    color: string;
    isAvailable: boolean;
  }>;
  allSizesForColor: Array<{
    sizeValue: ProductVariantSize;
    stock: number;
    isAvailable: boolean;
    variantId: string | null;
  }>;
  selectedColor: string | null;
  selectedSize: ProductVariantSize | null;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: ProductVariantSize) => void;
};

const DEFAULT_SWATCH_HEX = "#d4d4d8";

const VariantSelector = ({
  colorOptions,
  allSizesForColor,
  selectedColor,
  selectedSize,
  onColorSelect,
  onSizeSelect,
}: VariantSelectorProps) => {
  const [openUnavailableSize, setOpenUnavailableSize] =
    useState<ProductVariantSize | null>(null);

  useEffect(() => {
    if (!openUnavailableSize) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpenUnavailableSize((currentSize) =>
        currentSize === openUnavailableSize ? null : currentSize,
      );
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [openUnavailableSize]);

  function handleSizeClick(sizeValue: ProductVariantSize, isAvailable: boolean) {
    onSizeSelect(sizeValue);

    if (!isAvailable) {
      setOpenUnavailableSize(sizeValue);
      return;
    }

    setOpenUnavailableSize(null);
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 px-5">
        <div
          role="group"
          aria-labelledby="variant-colors-title"
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="variant-colors-title" className="font-medium">
              Cor
            </h3>
            <p className="text-muted-foreground text-sm">
              {selectedColor ?? "Selecione uma cor"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {colorOptions.map(({ color, isAvailable }) => {
              const colorHex = getColorHex(color);
              const hasMappedColor = colorHex !== DEFAULT_SWATCH_HEX;

              return (
                <Tooltip key={color}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Selecionar cor ${color}`}
                      aria-disabled={!isAvailable}
                      aria-pressed={selectedColor === color}
                      className={cn(
                        "flex min-w-[68px] flex-col items-center gap-2 rounded-2xl border px-3 py-2 transition-all",
                        selectedColor === color
                          ? "border-primary ring-primary/25 ring-4"
                          : "border-border hover:border-primary/40",
                        !isAvailable &&
                          "hover:border-border cursor-not-allowed opacity-45",
                      )}
                      onClick={() => onColorSelect(color)}
                    >
                      <span
                        className="block size-8 rounded-full border border-black/10"
                        style={{ backgroundColor: colorHex }}
                      />
                      {!hasMappedColor ? (
                        <span className="text-xs font-medium">{color}</span>
                      ) : null}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isAvailable ? color : "Indisponivel no momento"}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 id="variant-sizes-title" className="font-medium">
            Tamanho{" "}
            <span className="text-foreground font-semibold">
              {selectedSize ?? "Selecionar"}
            </span>
          </h3>

          <div
            role="group"
            aria-label="Selecione o tamanho"
            className="flex flex-wrap gap-2"
          >
            {allSizesForColor.map(
              ({ sizeValue, stock, isAvailable, variantId }) => {
                const isSelected = selectedSize === sizeValue;

                return (
                  <Popover
                    key={`${variantId ?? "missing"}-${sizeValue}`}
                    open={openUnavailableSize === sizeValue}
                    onOpenChange={(open) =>
                      setOpenUnavailableSize(open ? sizeValue : null)
                    }
                  >
                    <div className="min-w-[68px]">
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={
                            isAvailable
                              ? `Tamanho ${sizeValue}`
                              : `${sizeValue} - indisponivel`
                          }
                          aria-pressed={isSelected}
                          className={cn(
                            "relative isolate w-full overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold transition-all",
                            isSelected
                              ? "border-foreground bg-muted/30 border-2"
                              : "border-border hover:border-primary/40 border bg-transparent",
                            !isAvailable &&
                              "size-unavailable text-muted-foreground cursor-pointer opacity-50",
                            !isAvailable &&
                              isSelected &&
                              "border-muted-foreground/60 bg-muted/45",
                            !isAvailable &&
                              !isSelected &&
                              "hover:border-border hover:bg-muted/20",
                          )}
                          onClick={() =>
                            handleSizeClick(sizeValue, isAvailable)
                          }
                        >
                          {sizeValue}
                        </button>
                      </PopoverTrigger>

                      {stock > 0 ? (
                        <p className="text-muted-foreground mt-1 text-center text-[11px]">
                          {stock} unidades
                        </p>
                      ) : null}
                    </div>

                    <PopoverContent
                      side="top"
                      align="center"
                      sideOffset={8}
                      className="w-fit rounded-2xl px-3 py-2 text-sm"
                    >
                      Tamanho {sizeValue} indisponivel no momento
                    </PopoverContent>
                  </Popover>
                );
              },
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VariantSelector;
