import { z } from "zod";

export const upsertLogisticsConfigSchema = z.object({
  id: z.uuid().optional(),
  maxInstallments: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1 parcela.")
    .max(24, "Máximo 24 parcelas."),
  minInstallmentValueInCents: z.coerce
    .number()
    .int()
    .min(100, "Valor mínimo de R$ 1,00."),
  freeInstallmentsUpTo: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1 parcela sem juros.")
    .max(24),
  interestRatePercent: z.coerce
    .number()
    .min(0, "Taxa não pode ser negativa.")
    .max(10, "Máximo 10% ao mês."),
  returnPolicyDays: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1 dia.")
    .max(365, "Máximo 365 dias."),
  exchangePolicyText: z.string().trim().max(500).optional(),
  returnPolicyText: z.string().trim().max(500).optional(),
  paymentMethods: z
    .array(z.enum(["visa", "mastercard", "pix", "boleto", "elo", "amex"]))
    .min(1, "Selecione pelo menos um método de pagamento."),
});

export type UpsertLogisticsConfigInput = z.infer<
  typeof upsertLogisticsConfigSchema
>;
