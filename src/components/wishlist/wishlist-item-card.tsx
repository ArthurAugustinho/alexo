"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartOffIcon, Loader2Icon, ShoppingBagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { addProductToCart } from "@/actions/add-cart-product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/helpers/money";
import { removeFromWishlist } from "@/lib/actions/wishlist";
import { type WishlistItem } from "@/lib/queries/wishlist";

type WishlistItemCardProps = {
  item: WishlistItem;
};

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPendingRemove, startRemoveTransition] = useTransition();
  const [optimisticRemoved, setOptimisticRemoved] = useOptimistic(
    false,
    (_currentState: boolean, nextState: boolean) => nextState,
  );
  const { mutate: addToCart, isPending: isPendingAddToCart } = useMutation({
    mutationKey: ["addProductToCartFromWishlist", item.preferredVariantId],
    mutationFn: async () => {
      if (!item.preferredVariantId || !item.hasAvailableVariant) {
        throw new Error("Este produto esta indisponivel no momento.");
      }

      return addProductToCart({
        productVariantId: item.preferredVariantId,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
      toast.success("Produto adicionado a sacola.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel adicionar o produto ao carrinho.",
      );
    },
  });

  function invalidateWishlistQueries() {
    queryClient.invalidateQueries({
      queryKey: ["wishlist-product-ids"],
    });
  }

  function handleRemoveFromWishlist() {
    startRemoveTransition(async () => {
      setOptimisticRemoved(true);

      try {
        await removeFromWishlist(item.productId);
        invalidateWishlistQueries();
        router.refresh();
        toast.success("Produto removido da lista de desejos.");
      } catch (error) {
        setOptimisticRemoved(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "Nao foi possivel remover o produto da lista de desejos.",
        );
      }
    });
  }

  if (optimisticRemoved) {
    return null;
  }

  return (
    <article className="bg-background flex h-full flex-col overflow-hidden rounded-[28px] border shadow-sm">
      <Link href={item.productUrl} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={`Imagem do produto ${item.productName}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 18vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Sem imagem
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={item.productUrl}
              className="line-clamp-2 text-sm font-semibold hover:underline"
            >
              {item.productName}
            </Link>

            {!item.hasAvailableVariant ? (
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700"
              >
                Indisponivel
              </Badge>
            ) : null}
          </div>

          {item.productBrand ? (
            <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
              {item.productBrand}
            </p>
          ) : null}

          <p className="text-base font-semibold">
            {formatCentsToBRL(item.priceInCents)}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            type="button"
            className="rounded-full"
            onClick={() => addToCart()}
            disabled={!item.hasAvailableVariant || isPendingAddToCart}
          >
            {isPendingAddToCart ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ShoppingBagIcon className="size-4" />
            )}
            <span>Adicionar ao carrinho</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={handleRemoveFromWishlist}
            disabled={isPendingRemove}
          >
            {isPendingRemove ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HeartOffIcon className="size-4" />
            )}
            <span>Remover</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
