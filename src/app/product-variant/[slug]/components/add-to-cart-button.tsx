"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productVariantId: string;
  quantity: number;
}

const AddToCartButton = ({
  productVariantId,
  quantity,
}: AddToCartButtonProps) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationKey: ["addProductToCart", productVariantId, quantity],
    mutationFn: () =>
      addProductToCart({
        productVariantId,
        quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  return (
    <Button
      className="rounded-full"
      size="lg"
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => mutate()}
    >
      <span className="flex size-4 items-center justify-center">
        <Loader2
          aria-hidden="true"
          className={isPending ? "size-4 animate-spin" : "size-4 opacity-0"}
        />
      </span>
      <span>Adicionar à sacola</span>
    </Button>
  );
};

export default AddToCartButton;
