"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";
import { type ProductVariantModel } from "@/lib/product-variant-schema";
import { cn } from "@/lib/utils";

type ProductActionsProps = {
  isSelectedVariantAvailable: boolean;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedVariant: ProductVariantModel | null;
};

const ProductActions = ({
  isSelectedVariantAvailable,
  selectedColor,
  selectedSize,
  selectedVariant,
}: ProductActionsProps) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { mutate, isPending } = useMutation({
    mutationKey: ["addProductToCart", selectedVariant?.id, quantity],
    mutationFn: async () => {
      if (!selectedVariant) {
        throw new Error("Selecione uma cor e um tamanho para continuar");
      }

      return addProductToCart({
        productVariantId: selectedVariant.id,
        quantity,
      });
    },
    onSuccess: () => {
      setInlineError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produto adicionado a sacola.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel adicionar o produto.";

      setInlineError(message);
      toast.error(message);
    },
  });

  const isSelectionComplete = Boolean(selectedColor && selectedSize && selectedVariant);
  const canAddToCart = isSelectionComplete && isSelectedVariantAvailable;
  const helperMessage =
    isSelectionComplete && !isSelectedVariantAvailable
      ? "Indisponível no momento."
      : inlineError;

  function handleAddToCart() {
    if (!isSelectionComplete) {
      setInlineError("Selecione uma cor e um tamanho para continuar");
      return;
    }

    if (!isSelectedVariantAvailable) {
      setInlineError("Indisponível no momento.");
      return;
    }

    mutate();
  }

  return (
    <>
      <div className="px-5">
        <div className="space-y-4">
          <h3 className="font-medium">Quantidade</h3>
          <div className="flex w-[120px] items-center justify-between rounded-2xl border">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setQuantity((previous) => (previous > 1 ? previous - 1 : previous))}
            >
              <MinusIcon />
            </Button>
            <p>{quantity}</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setQuantity((previous) => previous + 1)}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-4 px-5">
        <Button
          type="button"
          size="lg"
          variant="outline"
          aria-disabled={!canAddToCart || isPending}
          className={cn(
            "rounded-full transition-opacity",
            !canAddToCart && "cursor-not-allowed opacity-60",
          )}
          disabled={!canAddToCart || isPending}
          onClick={handleAddToCart}
        >
          <span className="flex size-4 items-center justify-center">
            <Loader2
              aria-hidden="true"
              className={isPending ? "size-4 animate-spin" : "size-4 opacity-0"}
            />
          </span>
          <span>Adicionar a sacola</span>
        </Button>

        {helperMessage ? (
          <p className="text-sm text-destructive">{helperMessage}</p>
        ) : null}

        <Button className="rounded-full" size="lg" type="button">
          Comprar agora
        </Button>
      </div>
    </>
  );
};

export default ProductActions;

