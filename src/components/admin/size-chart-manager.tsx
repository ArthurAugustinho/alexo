"use client";

import { RulerIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteSizeChartEntry } from "@/lib/actions/size-charts";
import {
  SIZE_CHART_MEASUREMENT_FIELDS,
  type SizeChartEntry,
} from "@/lib/size-chart-schema";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EditSizeChartButton, SizeChartForm } from "./size-chart-form";

type SizeChartManagerProps = {
  categoryId: string;
  categoryName: string;
  entries: SizeChartEntry[];
};

function formatRange(params: {
  min: number | null;
  max: number | null;
  unit: string;
}) {
  if (typeof params.min === "number" && typeof params.max === "number") {
    return `${params.min} - ${params.max} ${params.unit}`;
  }

  return "Nao informado";
}

function DeleteSizeChartEntryDialog({
  categoryId,
  entry,
}: {
  categoryId: string;
  entry: SizeChartEntry;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSizeChartEntry({
        categoryId,
        entryId: entry.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Trash2Icon />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir linha de medidas</AlertDialogTitle>
          <AlertDialogDescription>
            A linha do tamanho {entry.sizeLabel} sera removida da categoria{" "}
            {categoryId}. Esta acao nao pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Confirmar exclusao
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SizeChartManager({
  categoryId,
  categoryName,
  entries,
}: SizeChartManagerProps) {
  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Tabela de medidas</CardTitle>
          <p className="text-muted-foreground text-sm">
            Configure as faixas por tamanho para a categoria {categoryName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {entries.length} linhas
          </Badge>
          <SizeChartForm categoryId={categoryId} mode="create" />
        </div>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RulerIcon className="size-5" />
            </div>
            Nenhuma tabela de medidas cadastrada ainda para esta categoria.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tamanho
                    </th>
                    {SIZE_CHART_MEASUREMENT_FIELDS.map((measurementField) => (
                      <th
                        key={measurementField.key}
                        scope="col"
                        className="px-4 py-3 font-medium"
                      >
                        {measurementField.label}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 font-medium text-right">
                      Acoes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t align-middle transition-colors hover:bg-muted/20"
                    >
                      <td className="px-4 py-4">
                        <Badge variant="secondary">{entry.sizeLabel}</Badge>
                      </td>
                      {SIZE_CHART_MEASUREMENT_FIELDS.map((measurementField) => (
                        <td key={measurementField.key} className="px-4 py-4">
                          {formatRange({
                            min: entry[measurementField.minField],
                            max: entry[measurementField.maxField],
                            unit: measurementField.unit,
                          })}
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <EditSizeChartButton
                            categoryId={categoryId}
                            entry={entry}
                          />
                          <DeleteSizeChartEntryDialog
                            categoryId={categoryId}
                            entry={entry}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
