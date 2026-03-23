"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createSizeChartEntry,
  updateSizeChartEntry,
} from "@/lib/actions/size-charts";
import {
  type CreateSizeChartEntryInput,
  createSizeChartEntrySchema,
  SIZE_CHART_MEASUREMENT_FIELDS,
  SIZE_CHART_SIZE_OPTIONS,
  type SizeChartEntry,
} from "@/lib/size-chart-schema";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

type SizeChartFormProps = {
  categoryId: string;
  entry?: SizeChartEntry;
  mode: "create" | "edit";
  trigger?: React.ReactNode;
};

function getDefaultSizeLabel(entry?: SizeChartEntry) {
  if (entry?.sizeLabel) {
    return entry.sizeLabel;
  }

  return "M";
}

export function SizeChartForm({
  categoryId,
  entry,
  mode,
  trigger,
}: SizeChartFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sizeOptions = useMemo(() => {
    if (entry?.sizeLabel && !SIZE_CHART_SIZE_OPTIONS.includes(entry.sizeLabel)) {
      return [entry.sizeLabel, ...SIZE_CHART_SIZE_OPTIONS];
    }

    return [...SIZE_CHART_SIZE_OPTIONS];
  }, [entry?.sizeLabel]);

  const defaultValues = useMemo<CreateSizeChartEntryInput>(
    () => ({
      categoryId,
      sizeLabel: getDefaultSizeLabel(entry),
      bustMin: entry?.bustMin ?? undefined,
      bustMax: entry?.bustMax ?? undefined,
      waistMin: entry?.waistMin ?? undefined,
      waistMax: entry?.waistMax ?? undefined,
      hipMin: entry?.hipMin ?? undefined,
      hipMax: entry?.hipMax ?? undefined,
      heightMin: entry?.heightMin ?? undefined,
      heightMax: entry?.heightMax ?? undefined,
      weightMin: entry?.weightMin ?? undefined,
      weightMax: entry?.weightMax ?? undefined,
    }),
    [categoryId, entry],
  );

  const form = useForm<CreateSizeChartEntryInput>({
    resolver: zodResolver(createSizeChartEntrySchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(values: CreateSizeChartEntryInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSizeChartEntry(values)
          : await updateSizeChartEntry({
              ...values,
              entryId: entry!.id,
            });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-xl">
            <PlusIcon />
            Nova linha
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Adicionar medida" : "Editar medida"}
          </DialogTitle>
          <DialogDescription>
            Defina os intervalos minimos e maximos por medida. Todos os campos
            sao opcionais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="sizeLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho</FormLabel>
                  <FormControl>
                    <select
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                      {...field}
                    >
                      {sizeOptions.map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              {SIZE_CHART_MEASUREMENT_FIELDS.map((measurementField) => (
                <div
                  key={measurementField.key}
                  className="rounded-2xl border border-border/70 p-4"
                >
                  <p className="text-sm font-medium">{measurementField.label}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={measurementField.minField}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min ({measurementField.unit})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              className="rounded-xl"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              disabled={field.disabled}
                              value={
                                typeof field.value === "number" ? field.value : ""
                              }
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={measurementField.maxField}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max ({measurementField.unit})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              className="rounded-xl"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              disabled={field.disabled}
                              value={
                                typeof field.value === "number" ? field.value : ""
                              }
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isPending}>
                {mode === "create" ? "Salvar medida" : "Salvar alteracoes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EditSizeChartButton({
  categoryId,
  entry,
}: Pick<SizeChartFormProps, "categoryId" | "entry">) {
  return (
    <SizeChartForm
      categoryId={categoryId}
      entry={entry}
      mode="edit"
      trigger={
        <Button variant="outline" size="sm" className="rounded-xl">
          <PencilLineIcon />
          Editar
        </Button>
      }
    />
  );
}
