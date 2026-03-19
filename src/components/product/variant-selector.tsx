"use client";

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
  sizeOptions: Array<{
    size: ProductVariantSize;
    isAvailable: boolean;
  }>;
  selectedColor: string | null;
  selectedSize: ProductVariantSize | null;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: ProductVariantSize) => void;
};

const DEFAULT_SWATCH_HEX = "#d4d4d8";

const VariantSelector = ({
  colorOptions,
  sizeOptions,
  selectedColor,
  selectedSize,
  onColorSelect,
  onSizeSelect,
}: VariantSelectorProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-6 px-5">
        <div role="group" aria-labelledby="variant-colors-title" className="space-y-3">
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
                          "cursor-not-allowed opacity-45 hover:border-border",
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
                    {isAvailable ? color : "Indisponível no momento"}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div role="group" aria-labelledby="variant-sizes-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 id="variant-sizes-title" className="font-medium">
              Tamanho
            </h3>
            <p className="text-muted-foreground text-sm">
              {selectedSize ?? "Selecione um tamanho"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {sizeOptions.map(({ size, isAvailable }) => (
              <Tooltip key={size}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-disabled={!isAvailable}
                    aria-pressed={selectedSize === size}
                    className={cn(
                      "min-w-14 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors",
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40",
                      !isAvailable &&
                        "cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground line-through hover:border-border",
                    )}
                    onClick={() => onSizeSelect(size)}
                  >
                    {size}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAvailable ? size : "Indisponível no momento"}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VariantSelector;
