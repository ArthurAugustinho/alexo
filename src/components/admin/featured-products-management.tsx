"use client";

import {
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCentsToBRL } from "@/helpers/money";
import {
  addAdminFeaturedProduct,
  removeAdminFeaturedProduct,
  reorderAdminFeaturedProducts,
} from "@/lib/actions/featured";
import {
  type FeaturedProductListItem,
  type FeaturedProductSearchItem,
} from "@/lib/admin-showcase-schema";

type FeaturedProductsManagementProps = {
  featuredProducts: FeaturedProductListItem[];
  searchResults: FeaturedProductSearchItem[];
  searchTerm: string;
};

function reorderItems(
  items: FeaturedProductListItem[],
  draggedId: string,
  targetId: string,
) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);

  if (!draggedItem) {
    return items;
  }

  nextItems.splice(targetIndex, 0, draggedItem);

  return nextItems.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function FeaturedProductsManagement({
  featuredProducts,
  searchResults,
  searchTerm,
}: FeaturedProductsManagementProps) {
  const router = useRouter();
  const debounceTimeoutRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [orderedFeaturedProducts, setOrderedFeaturedProducts] =
    useState(featuredProducts);

  function updateSearch(value: string) {
    setSearchValue(value);

    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => {
        const trimmedValue = value.trim();
        const href = trimmedValue
          ? `/admin/vitrine/mais-vendidos?query=${encodeURIComponent(trimmedValue)}`
          : "/admin/vitrine/mais-vendidos";

        router.replace(href);
      });
    }, 350);
  }

  function addProduct(productId: string) {
    startTransition(async () => {
      const result = await addAdminFeaturedProduct({ productId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function removeProduct(featuredProductId: string) {
    startTransition(async () => {
      const result = await removeAdminFeaturedProduct({ featuredProductId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function onDrop(targetId: string) {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      return;
    }

    const nextItems = reorderItems(
      orderedFeaturedProducts,
      draggedItemId,
      targetId,
    );

    setOrderedFeaturedProducts(nextItems);
    setDraggedItemId(null);

    startTransition(async () => {
      const result = await reorderAdminFeaturedProducts({
        items: nextItems.map((item, index) => ({
          id: item.id,
          position: index,
        })),
      });

      if (!result.success) {
        toast.error(result.message);
        setOrderedFeaturedProducts(featuredProducts);
        router.refresh();
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  const featuredLimitReached = orderedFeaturedProducts.length >= 10;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                Curadoria manual de destaque
              </CardTitle>
              <CardDescription>
                A ordem definida aqui é a mesma exibida na home da loja.
              </CardDescription>
            </div>

            <Badge className="rounded-full px-3 py-1">
              {orderedFeaturedProducts.length}/10 produtos
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {orderedFeaturedProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
              Nenhum produto foi destacado manualmente ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {orderedFeaturedProducts.map((item, index) => (
                <div
                  key={item.id}
                  draggable={!isPending}
                  onDragStart={() => setDraggedItemId(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(item.id)}
                  className="border-border/70 bg-muted/20 flex flex-col gap-3 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
                      <GripVerticalIcon className="text-muted-foreground size-5" />
                    </div>
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={item.imageUrl}
                        alt={`Produto destacado ${item.productName}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Posição {index + 1}</Badge>
                        <p className="truncate font-semibold">{item.productName}</p>
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {formatCentsToBRL(item.priceInCents)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    disabled={isPending}
                    onClick={() => removeProduct(item.id)}
                  >
                    <Trash2Icon />
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Buscar produtos</CardTitle>
            <CardDescription>
              Pesquise por nome para incluir produtos na lista manual de destaque.
            </CardDescription>
          </div>

          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchValue}
              onChange={(event) => updateSearch(event.target.value)}
              className="rounded-xl pl-9"
              placeholder="Buscar produto por nome"
              aria-label="Buscar produto por nome"
            />
            {isPending ? (
              <Loader2Icon className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {searchResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
              Nenhum produto encontrado para a busca atual.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((product) => (
                <div
                  key={product.productId}
                  className="border-border/70 bg-muted/20 flex items-center justify-between gap-3 rounded-3xl border p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={product.imageUrl}
                        alt={`Produto ${product.productName}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold">{product.productName}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {formatCentsToBRL(product.priceInCents)}
                      </p>
                    </div>
                  </div>

                  {product.alreadyFeatured ? (
                    <Badge variant="secondary">Já destacado</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl"
                      disabled={isPending || featuredLimitReached}
                      onClick={() => addProduct(product.productId)}
                    >
                      <PlusIcon />
                      Adicionar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {featuredLimitReached ? (
            <p className="text-muted-foreground mt-4 text-sm">
              O limite de 10 produtos já foi atingido. Remova um item para
              adicionar outro.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
