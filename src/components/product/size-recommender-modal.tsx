"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { recommendSize, type SizeRecommendation } from "@/helpers/recommend-size";
import {
  DEFAULT_BRAZILIAN_SIZE_CHART,
  SIZE_CHART_MEASUREMENT_FIELDS,
  type SizeChartRange,
  USER_MEASUREMENTS_STORAGE_KEY,
  type UserMeasurements,
  userMeasurementsSchema,
} from "@/lib/size-chart-schema";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type SizeRecommenderModalProps = {
  sizeChart: SizeChartRange[];
  categoryName: string;
  onSizeSelect: (size: string) => void;
};

const EMPTY_MEASUREMENTS: UserMeasurements = {
  bust: undefined,
  waist: undefined,
  hip: undefined,
  height: undefined,
  weight: undefined,
};

function formatRange(params: {
  min: number | null | undefined;
  max: number | null | undefined;
  unit: string;
}) {
  if (typeof params.min === "number" && typeof params.max === "number") {
    return `${params.min} - ${params.max} ${params.unit}`;
  }

  return "Nao informado";
}

function getConfidenceBadgeVariant(confidence: SizeRecommendation["confidence"]) {
  if (confidence === "exact") {
    return "default";
  }

  if (confidence === "closest") {
    return "secondary";
  }

  return "outline";
}

export function SizeRecommenderModal({
  sizeChart,
  categoryName,
  onSizeSelect,
}: SizeRecommenderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "result">("form");
  const [recommendation, setRecommendation] =
    useState<SizeRecommendation | null>(null);

  const effectiveSizeChart = useMemo(
    () =>
      (sizeChart.length > 0 ? sizeChart : DEFAULT_BRAZILIAN_SIZE_CHART).slice().sort(
        (first, second) => first.position - second.position,
      ),
    [sizeChart],
  );

  const form = useForm<UserMeasurements>({
    resolver: zodResolver(userMeasurementsSchema),
    defaultValues: EMPTY_MEASUREMENTS,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep("form");
    setRecommendation(null);

    const storedMeasurements = window.localStorage.getItem(
      USER_MEASUREMENTS_STORAGE_KEY,
    );

    if (!storedMeasurements) {
      form.reset(EMPTY_MEASUREMENTS);
      return;
    }

    const parsedStorageValue = (() => {
      try {
        return JSON.parse(storedMeasurements);
      } catch {
        return null;
      }
    })();

    const parsedMeasurements = userMeasurementsSchema.safeParse(
      parsedStorageValue,
    );

    if (!parsedMeasurements.success) {
      form.reset(EMPTY_MEASUREMENTS);
      return;
    }

    form.reset(parsedMeasurements.data);
  }, [form, isOpen]);

  function onSubmit(values: UserMeasurements) {
    window.localStorage.setItem(
      USER_MEASUREMENTS_STORAGE_KEY,
      JSON.stringify(values),
    );

    setRecommendation(recommendSize(values, effectiveSizeChart));
    setStep("result");
  }

  function handleSelectRecommendedSize() {
    if (!recommendation?.recommended) {
      return;
    }

    onSizeSelect(recommendation.recommended);
    setIsOpen(false);
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto rounded-xl px-0 text-sm font-medium text-primary"
          >
            Qual é o meu tamanho?
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Qual o seu tamanho?</DialogTitle>
            <DialogDescription>
              Informe suas medidas para receber uma sugestao baseada na tabela de{" "}
              {categoryName}.
            </DialogDescription>
          </DialogHeader>

          <div
            key={step}
            className="animate-in fade-in-0 slide-in-from-right-2 duration-200"
          >
            {step === "form" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">
                      Informe suas medidas
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Todos os campos sao opcionais. Quanto mais medidas voce
                      informar, melhor a recomendacao.
                    </p>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:text-foreground"
                      >
                        <InfoIcon className="size-4" />
                        Como medir?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      Meça busto, cintura e quadril contornando o corpo. Altura
                      deve ser medida em pe e peso em quilogramas.
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {SIZE_CHART_MEASUREMENT_FIELDS.map((measurementField) => (
                        <FormField
                          key={measurementField.key}
                          control={form.control}
                          name={measurementField.key}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {measurementField.label} ({measurementField.unit})
                              </FormLabel>
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
                                    typeof field.value === "number"
                                      ? field.value
                                      : ""
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
                      ))}
                    </div>

                    {sizeChart.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                        A categoria ainda nao possui tabela personalizada. Esta
                        recomendacao usa uma tabela brasileira de referencia.
                      </div>
                    ) : null}

                    <div className="flex justify-end">
                      <Button type="submit" className="rounded-xl">
                        Ver recomendacao
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
                    Tamanho recomendado
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span className="text-4xl font-semibold">
                      {recommendation?.recommended ?? "--"}
                    </span>
                    <Badge
                      variant={getConfidenceBadgeVariant(
                        recommendation?.confidence ?? "none",
                      )}
                    >
                      {recommendation?.confidence === "exact"
                        ? "Correspondencia exata"
                        : recommendation?.confidence === "closest"
                          ? "Melhor aproximacao"
                          : "Sem recomendacao"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm">
                    {recommendation?.message ??
                      "Informe ao menos uma medida para receber uma recomendacao"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">
                      Tabela de medidas
                    </h3>
                    {sizeChart.length === 0 ? (
                      <Badge variant="outline">Tabela de referencia</Badge>
                    ) : null}
                  </div>

                  <div className="overflow-hidden rounded-3xl border">
                    <div className="overflow-x-auto">
                      <table
                        role="table"
                        className="w-full min-w-[920px] text-left text-sm"
                      >
                        <thead className="bg-muted/40">
                          <tr>
                            <th scope="col" className="px-4 py-3 font-medium">
                              Tamanho
                            </th>
                            {SIZE_CHART_MEASUREMENT_FIELDS.map(
                              (measurementField) => (
                                <th
                                  key={measurementField.key}
                                  scope="col"
                                  className="px-4 py-3 font-medium"
                                >
                                  {measurementField.label}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {effectiveSizeChart.map((entry) => {
                            const isRecommended =
                              recommendation?.recommended === entry.sizeLabel;

                            return (
                              <tr
                                key={`${entry.sizeLabel}-${entry.position}`}
                                className={
                                  isRecommended
                                    ? "bg-primary/8 border-t"
                                    : "border-t"
                                }
                              >
                                <td className="px-4 py-4 font-semibold">
                                  {entry.sizeLabel}
                                </td>
                                {SIZE_CHART_MEASUREMENT_FIELDS.map(
                                  (measurementField) => (
                                    <td
                                      key={measurementField.key}
                                      className="px-4 py-4"
                                    >
                                      {formatRange({
                                        min: entry[measurementField.minField],
                                        max: entry[measurementField.maxField],
                                        unit: measurementField.unit,
                                      })}
                                    </td>
                                  ),
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setStep("form")}
                  >
                    Alterar medidas
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={handleSelectRecommendedSize}
                    disabled={!recommendation?.recommended}
                  >
                    Selecionar tamanho {recommendation?.recommended ?? "--"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
