"use client";

import { ImageIcon, Loader2, PencilLineIcon, SaveIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateVariantStock } from "@/lib/actions/variants";
import {
  type ProductSizeModel,
  type ProductSizeType,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";

import { DeleteVariantDialog } from "./delete-variant-dialog";
import { VariantForm } from "./variant-form";

type VariantTableProps = {
  productId: string;
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variants: ProductVariantModel[];
};

function buildInitialStockMap(variants: ProductVariantModel[]) {
  return Object.fromEntries(
    variants.map((variant) => [variant.id, String(variant.stock)]),
  );
}

export function VariantTable({
  productId,
  sizeType,
  productSizes,
  variants,
}: VariantTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftStocks, setDraftStocks] = useState<Record<string, string>>(
    buildInitialStockMap(variants),
  );
  const [pendingVariantIds, setPendingVariantIds] = useState<string[]>([]);

  useEffect(() => {
    setDraftStocks(buildInitialStockMap(variants));
  }, [variants]);

  const pendingVariantIdSet = useMemo(
    () => new Set(pendingVariantIds),
    [pendingVariantIds],
  );

  function handleStockInputChange(variantId: string, value: string) {
    setDraftStocks((currentStocks) => ({
      ...currentStocks,
      [variantId]: value,
    }));
  }

  function handleSaveStock(variant: ProductVariantModel) {
    const rawValue = draftStocks[variant.id] ?? String(variant.stock);
    const nextStock = Number(rawValue);

    if (
      rawValue.trim() === "" ||
      !Number.isInteger(nextStock) ||
      Number.isNaN(nextStock) ||
      nextStock < 0
    ) {
      toast.error("Informe um estoque inteiro maior ou igual a zero.");
      return;
    }

    setPendingVariantIds((currentIds) =>
      currentIds.includes(variant.id) ? currentIds : [...currentIds, variant.id],
    );

    startTransition(async () => {
      const result = await updateVariantStock({
        variantId: variant.id,
        stock: nextStock,
      });

      setPendingVariantIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== variant.id),
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Tabela de variantes</CardTitle>
      </CardHeader>

      <CardContent>
        {variants.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhuma variante cadastrada ainda para este produto.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Imagem
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Cor
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tamanho
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Estoque
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Disponibilidade
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">
                      Acoes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {variants.map((variant) => {
                    const variantIsPending = pendingVariantIdSet.has(variant.id);

                    return (
                      <tr
                        key={variant.id}
                        className="border-t align-middle transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-4">
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-muted">
                            {variant.imageUrl ? (
                              <Image
                                src={variant.imageUrl}
                                alt={`Imagem da variante ${variant.color} ${variant.size}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon className="text-muted-foreground size-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">{variant.color}</p>
                            <p className="text-muted-foreground text-xs">
                              Slug: {variant.slug}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant="secondary">{variant.size}</Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={draftStocks[variant.id] ?? String(variant.stock)}
                              onChange={(event) =>
                                handleStockInputChange(
                                  variant.id,
                                  event.target.value,
                                )
                              }
                              className="h-10 w-24 rounded-xl"
                              aria-label={`Estoque da variante ${variant.color} ${variant.size}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => handleSaveStock(variant)}
                              disabled={variantIsPending || isPending}
                            >
                              {variantIsPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <SaveIcon className="size-4" />
                              )}
                              Salvar
                            </Button>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge
                            variant={variant.stock > 0 ? "default" : "secondary"}
                          >
                            {variant.stock > 0 ? "Disponivel" : "Sem estoque"}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <VariantForm
                              mode="edit"
                              productId={productId}
                              sizeType={sizeType}
                              productSizes={productSizes}
                              variant={variant}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                >
                                  <PencilLineIcon />
                                  Editar
                                </Button>
                              }
                            />
                            <DeleteVariantDialog
                              variantId={variant.id}
                              variantLabel={`${variant.color} ${variant.size}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
