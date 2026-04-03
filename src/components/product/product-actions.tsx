"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, MinusIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { addProductToCart } from "@/lib/actions/cart";
import { type ProductVariantModel } from "@/lib/product-variant-schema";
import { type ShippingOption } from "@/lib/shipping-schema";
import { cn } from "@/lib/utils";
import { type CustomizationData } from "./product-customization";

type ProductActionsProps = {
  isSelectionComplete: boolean;
  selectedVariant: ProductVariantModel | null;
  selectedShipping: ShippingOption | null;
  customizationData: CustomizationData | null;
};

const ProductActions = ({
  isSelectionComplete,
  selectedVariant,
  selectedShipping,
  customizationData,
}: ProductActionsProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [shippingAlert, setShippingAlert] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationKey: ["addProductToCart", selectedVariant?.id, quantity],
    mutationFn: async () => {
      if (!selectedVariant || selectedVariant.stock <= 0) {
        throw new Error("Selecione um tamanho disponivel para continuar");
      }
      if (!selectedShipping) {
        throw new Error("Selecione uma opcao de frete para continuar");
      }
      return addProductToCart({
        productVariantId: selectedVariant.id,
        quantity,
        shippingCostInCents: selectedShipping.priceInCents,
        shippingServiceName: selectedShipping.name,
        shippingDaysMin: selectedShipping.deliveryTime,
        shippingDaysMax: selectedShipping.deliveryTime,
        customizationName: customizationData?.name || undefined,
        customizationNumber: customizationData?.number || undefined,
        customizationPatchId: customizationData?.patchText || undefined,
        customizationExtraInCents: customizationData?.totalExtraInCents ?? 0,
      });
    },
    onSuccess: () => {
      setShippingAlert(false);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produto adicionado a sacola.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel adicionar o produto.";
      toast.error(message);
    },
  });

  const canAddToCart = isSelectionComplete && !!selectedShipping;

  function handleAddToCart() {
    if (!isSelectionComplete || (selectedVariant?.stock ?? 0) <= 0) {
      toast.warning("Selecione um tamanho disponivel para continuar", {
        duration: 3000,
      });
      return;
    }
    if (!selectedShipping) {
      setShippingAlert(true);
      document
        .getElementById("shipping-calculator")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShippingAlert(false);
    mutate();
  }

  async function handleBuyNow() {
    if (!isSelectionComplete || (selectedVariant?.stock ?? 0) <= 0) {
      toast.warning("Selecione um tamanho disponivel para continuar", {
        duration: 3000,
      });
      return;
    }
    if (!selectedShipping) {
      setShippingAlert(true);
      document
        .getElementById("shipping-calculator")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShippingAlert(false);
    setIsBuyingNow(true);
    try {
      await addProductToCart({
        productVariantId: selectedVariant!.id,
        quantity,
        shippingCostInCents: selectedShipping.priceInCents,
        shippingServiceName: selectedShipping.name,
        shippingDaysMin: selectedShipping.deliveryTime,
        shippingDaysMax: selectedShipping.deliveryTime,
        customizationName: customizationData?.name || undefined,
        customizationNumber: customizationData?.number || undefined,
        customizationPatchId: customizationData?.patchText || undefined,
        customizationExtraInCents: customizationData?.totalExtraInCents ?? 0,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart/identification");
    } catch {
      toast.error("Nao foi possivel adicionar o produto.");
      setIsBuyingNow(false);
    }
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

        {shippingAlert && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Calcule e selecione o frete antes de adicionar ao carrinho.
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="rounded-full"
          size="lg"
          type="button"
          disabled={isBuyingNow}
          onClick={handleBuyNow}
        >
          {isBuyingNow && <Loader2 className="size-4 animate-spin" />}
          Comprar agora
        </Button>
      </div>
    </>
  );
};

export default ProductActions;
