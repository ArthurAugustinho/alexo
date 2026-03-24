"use client";

import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleHighlightCard } from "@/actions/toggle-highlight-card";
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
import type { HighlightCard } from "@/lib/queries/highlight-cards";

import { HighlightForm } from "./highlight-form";

type HighlightSlotProps = {
  initialCards: HighlightCard[];
};

type EditingState = {
  position: 1 | 2 | 3;
  card: HighlightCard | null;
};

export function HighlightSlot({ initialCards }: HighlightSlotProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cards, setCards] = useState(initialCards);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);

  function openForm(position: 1 | 2 | 3, card: HighlightCard | null) {
    setEditing({ position, card });
    setIsFormOpen(true);
  }

  function handleToggle(card: HighlightCard, isActive: boolean) {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isActive } : c)),
    );

    startTransition(async () => {
      const result = await toggleHighlightCard({ id: card.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setCards(initialCards);
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
            <CardTitle className="text-2xl">Tríade de destaque</CardTitle>
            <CardDescription>
              3 cards exibidos em grid assimétrico na home. A seção só aparece
              quando todos os 3 estão ativos.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {POSITIONS.map((pos) => {
              const card = cards.find((c) => c.position === pos) ?? null;

              return (
                <div
                  key={pos}
                  className="flex flex-col gap-3 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Posição {pos}
                    </span>
                    {card && (
                      <Badge
                        className={
                          card.isActive
                            ? "bg-emerald-100 text-emerald-700 border-transparent"
                            : "bg-slate-200 text-slate-700 border-transparent"
                        }
                      >
                        {card.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>

                  {card ? (
                    <>
                      <div
                        className="h-32 w-full rounded-xl"
                        style={{
                          backgroundImage: `url(${card.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      <p className="truncate text-sm font-medium">
                        {card.title}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <Switch
                          checked={card.isActive}
                          onCheckedChange={(checked) =>
                            handleToggle(card, checked)
                          }
                          disabled={isPending}
                          aria-label={`${card.isActive ? "Desativar" : "Ativar"} destaque`}
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openForm(pos, card)}
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
            <HighlightForm
              card={editing.card}
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
