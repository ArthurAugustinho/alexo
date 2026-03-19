"use client";

import { ImageIcon, Loader2, PencilLineIcon } from "lucide-react";
import Image from "next/image";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleAvailability } from "@/lib/actions/variants";
import { type ProductVariantModel } from "@/lib/product-variant-schema";
import { cn } from "@/lib/utils";

import { DeleteVariantDialog } from "./delete-variant-dialog";
import { VariantForm } from "./variant-form";

type VariantTableProps = {
  productId: string;
  variants: ProductVariantModel[];
};

type ToggleAvailabilityPayload = {
  variantId: string;
  isAvailable: boolean;
};

export function VariantTable({ productId, variants }: VariantTableProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingVariantIds, setPendingVariantIds] = useState<string[]>([]);
  const [optimisticVariants, applyOptimisticToggle] = useOptimistic(
    variants,
    (currentVariants, payload: ToggleAvailabilityPayload) =>
      currentVariants.map((variant) =>
        variant.id === payload.variantId
          ? { ...variant, isAvailable: payload.isAvailable }
          : variant,
      ),
  );

  const pendingVariantIdSet = useMemo(
    () => new Set(pendingVariantIds),
    [pendingVariantIds],
  );

  function handleToggleAvailability(variant: ProductVariantModel) {
    const nextAvailability = !variant.isAvailable;

    setPendingVariantIds((currentIds) =>
      currentIds.includes(variant.id) ? currentIds : [...currentIds, variant.id],
    );
    applyOptimisticToggle({
      variantId: variant.id,
      isAvailable: nextAvailability,
    });

    startTransition(async () => {
      const result = await toggleAvailability({
        variantId: variant.id,
        isAvailable: nextAvailability,
      });

      setPendingVariantIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== variant.id),
      );

      if (!result.success) {
        applyOptimisticToggle({
          variantId: variant.id,
          isAvailable: variant.isAvailable,
        });
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Tabela de variantes</CardTitle>
      </CardHeader>

      <CardContent>
        {optimisticVariants.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhuma variante cadastrada ainda para este produto.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
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
                      Disponível
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {optimisticVariants.map((variant) => {
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
                          <button
                            type="button"
                            role="switch"
                            aria-checked={variant.isAvailable}
                            aria-busy={variantIsPending}
                            aria-label={`Alternar disponibilidade da variante ${variant.color} ${variant.size}`}
                            className={cn(
                              "relative inline-flex h-7 w-14 items-center rounded-full border transition-colors",
                              variant.isAvailable
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-300 bg-slate-300",
                              (variantIsPending || isPending) && "opacity-70",
                            )}
                            disabled={variantIsPending}
                            onClick={() => handleToggleAvailability(variant)}
                          >
                            <span
                              className={cn(
                                "inline-flex size-5 items-center justify-center rounded-full bg-white text-slate-500 transition-transform",
                                variant.isAvailable
                                  ? "translate-x-8"
                                  : "translate-x-1",
                              )}
                            >
                              {variantIsPending ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : null}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <VariantForm
                              mode="edit"
                              productId={productId}
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
