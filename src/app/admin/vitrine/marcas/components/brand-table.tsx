"use client";

import {
  ExternalLinkIcon,
  GripVerticalIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reorderPartnerBrands } from "@/actions/reorder-partner-brands";
import { togglePartnerBrand } from "@/actions/toggle-partner-brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { PartnerBrand } from "@/lib/queries/partner-brands";

import { BrandForm } from "./brand-form";
import { DeleteBrandDialog } from "./delete-brand-dialog";

type BrandTableProps = {
  initialBrands: PartnerBrand[];
};

function reorderItems(
  items: PartnerBrand[],
  draggedId: string,
  targetId: string,
): PartnerBrand[] {
  const fromIndex = items.findIndex((b) => b.id === draggedId);
  const toIndex = items.findIndex((b) => b.id === targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;

  next.splice(toIndex, 0, moved);
  return next.map((b, i) => ({ ...b, position: i }));
}

export function BrandTable({ initialBrands }: BrandTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [brands, setBrands] = useState(initialBrands);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<PartnerBrand | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState<PartnerBrand | null>(
    null,
  );

  function openCreate() {
    setEditingBrand(null);
    setIsFormOpen(true);
  }

  function openEdit(brand: PartnerBrand) {
    setEditingBrand(brand);
    setIsFormOpen(true);
  }

  function handleToggle(brand: PartnerBrand, isActive: boolean) {
    setBrands((prev) =>
      prev.map((b) => (b.id === brand.id ? { ...b, isActive } : b)),
    );

    startTransition(async () => {
      const result = await togglePartnerBrand({ id: brand.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setBrands(initialBrands);
        return;
      }

      router.refresh();
    });
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const reordered = reorderItems(brands, draggedId, targetId);
    setBrands(reordered);
    setDraggedId(null);

    startTransition(async () => {
      const result = await reorderPartnerBrands({
        items: reordered.map((b, i) => ({ id: b.id, position: i })),
      });

      if (!result.success) {
        toast.error(result.message);
        setBrands(initialBrands);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  const nextPosition = brands.length > 0
    ? Math.max(...brands.map((b) => b.position)) + 1
    : 0;

  return (
    <>
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Marcas parceiras</CardTitle>
              <CardDescription>
                Arraste para reordenar. As marcas ativas aparecem na vitrine da
                loja.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl">
              <PlusIcon />
              Nova marca
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {brands.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhuma marca cadastrada. Adicione a primeira!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  draggable
                  onDragStart={() => handleDragStart(brand.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(brand.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-opacity ${
                    draggedId === brand.id ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    className="text-muted-foreground cursor-grab active:cursor-grabbing"
                    aria-label="Arrastar para reordenar"
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>

                  <div className="relative h-10 w-16 shrink-0">
                    <Image
                      src={brand.logoUrl}
                      alt={brand.name}
                      fill
                      className="object-contain grayscale"
                      sizes="64px"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{brand.name}</p>
                    {brand.linkUrl && (
                      <a
                        href={brand.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                      >
                        <ExternalLinkIcon className="size-3" />
                        {brand.linkUrl}
                      </a>
                    )}
                  </div>

                  <span className="text-muted-foreground hidden text-xs xl:block">
                    #{brand.position}
                  </span>

                  <Switch
                    checked={brand.isActive}
                    onCheckedChange={(checked) => handleToggle(brand, checked)}
                    disabled={isPending}
                    aria-label={`${brand.isActive ? "Desativar" : "Ativar"} marca`}
                  />

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(brand)}
                      aria-label="Editar marca"
                    >
                      <PencilLineIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      onClick={() => setDeletingBrand(brand)}
                      aria-label="Excluir marca"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <BrandForm
            brand={editingBrand}
            nextPosition={nextPosition}
            onSuccess={() => {
              setIsFormOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteBrandDialog
        brand={deletingBrand}
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => {
          if (!open) setDeletingBrand(null);
        }}
        onSuccess={() => {
          setDeletingBrand(null);
          router.refresh();
        }}
      />
    </>
  );
}
