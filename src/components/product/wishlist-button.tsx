"use client";

import { useQueryClient } from "@tanstack/react-query";
import { HeartIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  initialIsWishlisted: boolean;
};

export function WishlistButton({
  productId,
  initialIsWishlisted,
}: WishlistButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [optimisticIsWishlisted, setOptimisticIsWishlisted] = useOptimistic(
    initialIsWishlisted,
    (_currentState: boolean, nextState: boolean) => nextState,
  );

  function invalidateWishlistQueries() {
    queryClient.invalidateQueries({
      queryKey: ["wishlist-product-ids", session?.user.id],
    });
  }

  function handleToggleWishlist() {
    if (!session?.user.id) {
      toast.info("Faca login para salvar seus produtos favoritos.");
      router.push("/login");
      return;
    }

    const nextState = !optimisticIsWishlisted;

    startTransition(async () => {
      setOptimisticIsWishlisted(nextState);

      try {
        const result = await toggleWishlist(productId);

        setOptimisticIsWishlisted(result.added);
        invalidateWishlistQueries();
        router.refresh();
        toast.success(
          result.added
            ? "Produto adicionado a lista de desejos."
            : "Produto removido da lista de desejos.",
        );
      } catch (error) {
        setOptimisticIsWishlisted(!nextState);
        toast.error(
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a lista de desejos.",
        );
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-full"
      aria-label={
        optimisticIsWishlisted
          ? "Remover da lista de desejos"
          : "Adicionar a lista de desejos"
      }
      onClick={handleToggleWishlist}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <HeartIcon
          className={cn(
            "size-4 transition-colors",
            optimisticIsWishlisted && "fill-rose-500 text-rose-500",
          )}
        />
      )}
    </Button>
  );
}
