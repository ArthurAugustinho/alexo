"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertLogisticsConfig } from "@/actions/upsert-logistics-config";
import {
  type UpsertLogisticsConfigInput,
  upsertLogisticsConfigSchema,
} from "@/actions/upsert-logistics-config/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LogisticsConfig } from "@/lib/queries/logistics";

const PAYMENT_METHOD_OPTIONS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
] as const;

type LogisticsConfigFormProps = {
  config: LogisticsConfig | null;
};

export function LogisticsConfigForm({ config }: LogisticsConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const formResolver = zodResolver(
    upsertLogisticsConfigSchema,
  ) as Resolver<UpsertLogisticsConfigInput, unknown, UpsertLogisticsConfigInput>;

  const form = useForm<UpsertLogisticsConfigInput, unknown, UpsertLogisticsConfigInput>({
    resolver: formResolver,
    defaultValues: {
      id: config?.id,
      maxInstallments: config?.maxInstallments ?? 12,
      minInstallmentValueInCents: config?.minInstallmentValueInCents ?? 2000,
      freeInstallmentsUpTo: config?.freeInstallmentsUpTo ?? 1,
      interestRatePercent: config?.interestRatePercent ?? 0,
      returnPolicyDays: config?.returnPolicyDays ?? 30,
      exchangePolicyText: config?.exchangePolicyText ?? "",
      returnPolicyText: config?.returnPolicyText ?? "",
      successImageUrl: config?.successImageUrl ?? "",
      cancelImageUrl: config?.cancelImageUrl ?? "",
      paymentMethods: (config?.paymentMethods ?? [
        "visa",
        "mastercard",
        "pix",
        "boleto",
        "elo",
        "amex",
      ]) as UpsertLogisticsConfigInput["paymentMethods"],
    },
  });

  function onSubmit(values: UpsertLogisticsConfigInput) {
    startTransition(async () => {
      const result = await upsertLogisticsConfig(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <div className="border-border/70 rounded-3xl border p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">Logística e pagamento</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Installments */}
          <fieldset className="border-border/60 space-y-4 rounded-2xl border p-4">
            <legend className="px-1 text-sm font-medium">Parcelamento</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freeInstallmentsUpTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas sem juros (até)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRatePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de juros ao mês (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.01}
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minInstallmentValueInCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor mínimo por parcela (em centavos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={100}
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* Policies */}
          <fieldset className="border-border/60 space-y-4 rounded-2xl border p-4">
            <legend className="px-1 text-sm font-medium">
              Políticas de troca e devolução
            </legend>

            <FormField
              control={form.control}
              name="returnPolicyDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de devolução (dias)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchangePolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto de troca (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Ex: Trocamos em até 30 dias mediante apresentação da nota fiscal."
                      className="rounded-xl"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto de devolução (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Ex: Devoluções aceitas em até 30 dias após o recebimento."
                      className="rounded-xl"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          {/* Payment methods */}
          <FormField
            control={form.control}
            name="paymentMethods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formas de pagamento exibidas</FormLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const isChecked = field.value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            field.onChange(
                              field.value.filter((v) => v !== option.value),
                            );
                          } else {
                            field.onChange([...field.value, option.value]);
                          }
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                          isChecked
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checkout images — hidden: animações Lottie integradas substituem as URLs */}
          <div className="hidden">
            <FormField
              control={form.control}
              name="successImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cancelImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            As páginas de checkout utilizam animações integradas ao sistema.
          </p>

          <div className="flex justify-end">
            <Button type="submit" className="rounded-xl" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
