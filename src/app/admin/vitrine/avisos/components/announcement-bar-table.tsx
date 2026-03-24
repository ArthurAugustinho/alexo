"use client";

import {
  ExternalLinkIcon,
  GripVerticalIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reorderAnnouncementBars } from "@/actions/reorder-announcement-bars";
import { toggleAnnouncementBar } from "@/actions/toggle-announcement-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { AnnouncementBar } from "@/lib/queries/announcement-bars";

import { AnnouncementBarForm } from "./announcement-bar-form";
import { DeleteAnnouncementDialog } from "./delete-announcement-dialog";

type AnnouncementBarTableProps = {
  initialBars: AnnouncementBar[];
};

type BarStatus = "Ativo" | "Inativo" | "Agendado" | "Expirado";

function getBarStatus(bar: AnnouncementBar): BarStatus {
  const now = new Date();

  if (!bar.isActive) return "Inativo";
  if (bar.startDate && bar.startDate > now) return "Agendado";
  if (bar.endDate && bar.endDate < now) return "Expirado";
  return "Ativo";
}

function getStatusBadgeClass(status: BarStatus): string {
  switch (status) {
    case "Ativo":
      return "bg-emerald-100 text-emerald-700 border-transparent";
    case "Inativo":
      return "bg-slate-200 text-slate-700 border-transparent";
    case "Agendado":
      return "bg-sky-100 text-sky-700 border-transparent";
    case "Expirado":
      return "bg-red-100 text-red-700 border-transparent";
  }
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function reorderItems(
  items: AnnouncementBar[],
  draggedId: string,
  targetId: string,
): AnnouncementBar[] {
  const fromIndex = items.findIndex((b) => b.id === draggedId);
  const toIndex = items.findIndex((b) => b.id === targetId);

  if (
    fromIndex === -1 ||
    toIndex === -1 ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;

  next.splice(toIndex, 0, moved);
  return next.map((b, i) => ({ ...b, position: i }));
}

export function AnnouncementBarTable({ initialBars }: AnnouncementBarTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bars, setBars] = useState(initialBars);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingBar, setEditingBar] = useState<AnnouncementBar | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingBar, setDeletingBar] = useState<AnnouncementBar | null>(null);

  function openCreate() {
    setEditingBar(null);
    setIsFormOpen(true);
  }

  function openEdit(bar: AnnouncementBar) {
    setEditingBar(bar);
    setIsFormOpen(true);
  }

  function handleToggle(bar: AnnouncementBar, isActive: boolean) {
    setBars((prev) =>
      prev.map((b) => (b.id === bar.id ? { ...b, isActive } : b)),
    );

    startTransition(async () => {
      const result = await toggleAnnouncementBar({ id: bar.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setBars(initialBars);
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

    const reordered = reorderItems(bars, draggedId, targetId);
    setBars(reordered);
    setDraggedId(null);

    startTransition(async () => {
      const result = await reorderAnnouncementBars({
        items: reordered.map((b, i) => ({ id: b.id, position: i })),
      });

      if (!result.success) {
        toast.error(result.message);
        setBars(initialBars);
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
              <CardTitle className="text-2xl">Avisos da barra</CardTitle>
              <CardDescription>
                Arraste para reordenar. Os avisos ativos rodam automaticamente
                no topo da loja.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl">
              <PlusIcon />
              Novo aviso
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {bars.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum aviso cadastrado. Crie o primeiro!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bars.map((bar) => {
                const status = getBarStatus(bar);
                return (
                  <div
                    key={bar.id}
                    draggable
                    onDragStart={() => handleDragStart(bar.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(bar.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-opacity ${
                      draggedId === bar.id ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      className="text-muted-foreground cursor-grab active:cursor-grabbing"
                      aria-label="Arrastar para reordenar"
                    >
                      <GripVerticalIcon className="size-4" />
                    </button>

                    <div
                      className="h-6 w-20 shrink-0 rounded"
                      style={{
                        backgroundColor: bar.bgColor,
                        color: bar.textColor,
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}
                    >
                      <span className="truncate">{bar.text}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{bar.text}</p>
                      {bar.linkUrl && (
                        <a
                          href={bar.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                        >
                          <ExternalLinkIcon className="size-3" />
                          {bar.linkUrl}
                        </a>
                      )}
                    </div>

                    <Badge className={getStatusBadgeClass(status)}>
                      {status}
                    </Badge>

                    <div className="text-muted-foreground hidden text-xs xl:block">
                      <div>{formatDateTime(bar.startDate)}</div>
                      <div>{formatDateTime(bar.endDate)}</div>
                    </div>

                    <Switch
                      checked={bar.isActive}
                      onCheckedChange={(checked) => handleToggle(bar, checked)}
                      disabled={isPending}
                      aria-label={`${bar.isActive ? "Desativar" : "Ativar"} aviso`}
                    />

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(bar)}
                        aria-label="Editar aviso"
                      >
                        <PencilLineIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-8"
                        onClick={() => setDeletingBar(bar)}
                        aria-label="Excluir aviso"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AnnouncementBarForm
            bar={editingBar}
            onSuccess={() => {
              setIsFormOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteAnnouncementDialog
        bar={deletingBar}
        open={Boolean(deletingBar)}
        onOpenChange={(open) => {
          if (!open) setDeletingBar(null);
        }}
        onSuccess={() => {
          setDeletingBar(null);
          router.refresh();
        }}
      />
    </>
  );
}
