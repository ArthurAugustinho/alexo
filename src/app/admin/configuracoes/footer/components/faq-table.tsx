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

import { reorderFaqItems } from "@/actions/reorder-faq-items";
import { toggleFaqItem } from "@/actions/toggle-faq-item";
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
import type { FaqItem } from "@/lib/queries/faq";

import { DeleteFaqDialog } from "./delete-faq-dialog";
import { FaqForm } from "./faq-form";

type FaqTableProps = {
  initialItems: FaqItem[];
};

function reorderItems(
  items: FaqItem[],
  draggedId: string,
  targetId: string,
): FaqItem[] {
  const fromIndex = items.findIndex((i) => i.id === draggedId);
  const toIndex = items.findIndex((i) => i.id === targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;

  next.splice(toIndex, 0, moved);
  return next.map((item, i) => ({ ...item, position: i }));
}

export function FaqTable({ initialItems }: FaqTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FaqItem | null>(null);

  function openCreate() {
    setEditingItem(null);
    setIsFormOpen(true);
  }

  function openEdit(item: FaqItem) {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  function handleToggle(item: FaqItem, isActive: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isActive } : i)),
    );

    startTransition(async () => {
      const result = await toggleFaqItem({ id: item.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setItems(initialItems);
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

    const reordered = reorderItems(items, draggedId, targetId);
    setItems(reordered);
    setDraggedId(null);

    startTransition(async () => {
      const result = await reorderFaqItems({
        items: reordered.map((item, i) => ({ id: item.id, position: i })),
      });

      if (!result.success) {
        toast.error(result.message);
        setItems(initialItems);
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
              <CardTitle className="text-2xl">FAQ</CardTitle>
              <CardDescription>
                Arraste para reordenar. As perguntas ativas aparecem no footer
                da loja.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl">
              <PlusIcon />
              Nova pergunta
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhuma pergunta cadastrada. Adicione a primeira!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item.id)}
                  className={`flex items-start gap-3 rounded-2xl border p-3 transition-opacity ${
                    draggedId === item.id ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    className="text-muted-foreground mt-1 cursor-grab active:cursor-grabbing"
                    aria-label="Arrastar para reordenar"
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {item.answer}
                    </p>
                  </div>

                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => handleToggle(item, checked)}
                    disabled={isPending}
                    aria-label={`${item.isActive ? "Desativar" : "Ativar"} pergunta`}
                  />

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(item)}
                      aria-label="Editar pergunta"
                    >
                      <PencilLineIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      onClick={() => setDeletingItem(item)}
                      aria-label="Excluir pergunta"
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
          <FaqForm
            item={editingItem}
            onSuccess={() => {
              setIsFormOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteFaqDialog
        item={deletingItem}
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        onSuccess={() => {
          setDeletingItem(null);
          router.refresh();
        }}
      />
    </>
  );
}
