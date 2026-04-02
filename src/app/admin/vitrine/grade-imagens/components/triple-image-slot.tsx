"use client";

import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleTripleImageItem } from "@/actions/toggle-triple-image-item";
import { Badge } from "@/components/ui/badge";
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
import type { TripleImageGridItem } from "@/lib/queries/triple-image-grid";

import { TripleImageForm } from "./triple-image-form";

type TripleImageSlotProps = {
  initialItems: TripleImageGridItem[];
};

type EditingState = {
  position: 1 | 2 | 3;
  item: TripleImageGridItem | null;
};

export function TripleImageSlot({ initialItems }: TripleImageSlotProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);

  function openForm(position: 1 | 2 | 3, item: TripleImageGridItem | null) {
    setEditing({ position, item });
    setIsFormOpen(true);
  }

  function handleToggle(item: TripleImageGridItem, isActive: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isActive } : i)),
    );

    startTransition(async () => {
      const result = await toggleTripleImageItem({ id: item.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setItems(initialItems);
        return;
      }

      router.refresh();
    });
  }

  const POSITIONS = [1, 2, 3] as const;

  return (
    <>
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Grade de imagens</CardTitle>
            <CardDescription>
              3 imagens quadradas exibidas em grid na home. A grade só aparece
              quando todos os 3 slots estão ativos.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {POSITIONS.map((pos) => {
              const item = items.find((i) => i.position === pos) ?? null;

              return (
                <div
                  key={pos}
                  className="flex flex-col gap-3 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Posição {pos}
                    </span>
                    {item && (
                      <Badge
                        className={
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700 border-transparent"
                            : "bg-slate-200 text-slate-700 border-transparent"
                        }
                      >
                        {item.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>

                  {item ? (
                    <>
                      <div
                        className="aspect-square w-full overflow-hidden rounded-xl"
                        style={{
                          backgroundImage: `url(${item.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      <div className="flex items-center justify-between gap-2">
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(checked) =>
                            handleToggle(item, checked)
                          }
                          disabled={isPending}
                          aria-label={`${item.isActive ? "Desativar" : "Ativar"} posição ${pos}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openForm(pos, item)}
                        >
                          <PencilLineIcon className="size-3.5" />
                          Editar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-8">
                      <p className="text-muted-foreground text-xs">
                        Slot vazio
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => openForm(pos, null)}
                      >
                        <PlusIcon className="size-3.5" />
                        Preencher
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing && (
            <TripleImageForm
              item={editing.item}
              position={editing.position}
              onSuccess={() => {
                setIsFormOpen(false);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
