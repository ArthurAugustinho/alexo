"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";
import { type ProductVariantModel } from "@/lib/product-variant-schema";
import { cn } from "@/lib/utils";

type ProductActionsProps = {
  isSelectionComplete: boolean;
  selectedVariant: ProductVariantModel | null;
};

const ProductActions = ({
  isSelectionComplete,
  selectedVariant,
}: ProductActionsProps) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { mutate, isPending } = useMutation({
    mutationKey: ["addProductToCart", selectedVariant?.id, quantity],
    mutationFn: async () => {
      if (!selectedVariant || selectedVariant.stock <= 0) {
        throw new Error("Selecione um tamanho disponivel para continuar");
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

  const canAddToCart = isSelectionComplete;

  useEffect(() => {
    if (isSelectionComplete) {
      setInlineError(null);
    }
  }, [isSelectionComplete]);

  function handleAddToCart() {
    if (!isSelectionComplete || (selectedVariant?.stock ?? 0) <= 0) {
      const message = "Selecione um tamanho disponivel para continuar";
      setInlineError(message);
      toast.warning(message, {
        duration: 3000,
      });
      return;
    }

    setInlineError(null);
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
              onClick={() =>
                setQuantity((previous) =>
                  previous > 1 ? previous - 1 : previous,
                )
              }
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
          disabled={isPending}
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

        {inlineError ? (
          <p className="text-destructive text-sm">{inlineError}</p>
        ) : null}

        <Button className="rounded-full" size="lg" type="button">
          Comprar agora
        </Button>
      </div>
    </>
  );
};

export default ProductActions;
