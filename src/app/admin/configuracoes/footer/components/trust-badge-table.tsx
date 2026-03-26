"use client";

import {
  GripVerticalIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reorderTrustBadges } from "@/actions/reorder-trust-badges";
import { toggleTrustBadge } from "@/actions/toggle-trust-badge";
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
import type { TrustBadge } from "@/lib/queries/trust-badges";

import { DeleteBadgeDialog } from "./delete-badge-dialog";
import { TrustBadgeForm } from "./trust-badge-form";

type TrustBadgeTableProps = {
  initialBadges: TrustBadge[];
};

function reorderItems(
  items: TrustBadge[],
  draggedId: string,
  targetId: string,
): TrustBadge[] {
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

export function TrustBadgeTable({ initialBadges }: TrustBadgeTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [badges, setBadges] = useState(initialBadges);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingBadge, setDeletingBadge] = useState<TrustBadge | null>(null);

  function openCreate() {
    setEditingBadge(null);
    setIsFormOpen(true);
  }

  function openEdit(badge: TrustBadge) {
    setEditingBadge(badge);
    setIsFormOpen(true);
  }

  function handleToggle(badge: TrustBadge, isActive: boolean) {
    setBadges((prev) =>
      prev.map((b) => (b.id === badge.id ? { ...b, isActive } : b)),
    );

    startTransition(async () => {
      const result = await toggleTrustBadge({ id: badge.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setBadges(initialBadges);
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

    const reordered = reorderItems(badges, draggedId, targetId);
    setBadges(reordered);
    setDraggedId(null);

    startTransition(async () => {
      const result = await reorderTrustBadges({
        items: reordered.map((b, i) => ({ id: b.id, position: i })),
      });

      if (!result.success) {
        toast.error(result.message);
        setBadges(initialBadges);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Selos de segurança</CardTitle>
              <CardDescription>
                Arraste para reordenar. Os selos ativos aparecem no rodapé da
                loja.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl">
              <PlusIcon />
              Adicionar selo
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {badges.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum selo cadastrado. Adicione o primeiro!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  draggable
                  onDragStart={() => handleDragStart(badge.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(badge.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-opacity ${
                    draggedId === badge.id ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    className="text-muted-foreground cursor-grab active:cursor-grabbing"
                    aria-label="Arrastar para reordenar"
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>

                  {/* Preview 32×32 */}
                  <div className="size-8 shrink-0 overflow-hidden rounded border bg-muted/30">
                    <div
                      className="size-full"
                      style={{
                        backgroundImage: `url(${badge.imageUrl})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {badge.label}
                    </p>
                    {badge.linkUrl && (
                      <p className="text-muted-foreground truncate text-xs">
                        {badge.linkUrl}
                      </p>
                    )}
                  </div>

                  <span className="text-muted-foreground hidden text-xs xl:block">
                    #{badge.position}
                  </span>

                  <Switch
                    checked={badge.isActive}
                    onCheckedChange={(checked) => handleToggle(badge, checked)}
                    disabled={isPending}
                    aria-label={`${badge.isActive ? "Desativar" : "Ativar"} selo`}
                  />

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(badge)}
                      aria-label="Editar selo"
                    >
                      <PencilLineIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      onClick={() => setDeletingBadge(badge)}
                      aria-label="Excluir selo"
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
          <TrustBadgeForm
            badge={editingBadge}
            onSuccess={() => {
              setIsFormOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteBadgeDialog
        badge={deletingBadge}
        open={Boolean(deletingBadge)}
        onOpenChange={(open) => {
          if (!open) setDeletingBadge(null);
        }}
        onSuccess={() => {
          setDeletingBadge(null);
          router.refresh();
        }}
      />
    </>
  );
}
