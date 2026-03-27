import {
  ArrowLeftRightIcon,
  PackageCheckIcon,
  RefreshCcwIcon,
} from "lucide-react";
import Image from "next/image";

import {
  calculateInstallments,
  getBestInstallmentLabel,
} from "@/helpers/calculate-installments";
import type { LogisticsConfig } from "@/lib/queries/logistics";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  pix: "Pix",
  boleto: "Boleto",
  elo: "Elo",
  amex: "Amex",
};

type LogisticsBlockProps = {
  config: LogisticsConfig;
  priceInCents: number;
};

export function LogisticsBlock({ config, priceInCents }: LogisticsBlockProps) {
  const installmentOptions = calculateInstallments({
    priceInCents,
    maxInstallments: config.maxInstallments,
    minInstallmentValueInCents: config.minInstallmentValueInCents,
    freeInstallmentsUpTo: config.freeInstallmentsUpTo,
    interestRatePercent: config.interestRatePercent,
  });

  const bestLabel = getBestInstallmentLabel(installmentOptions);

  const hasExchange = Boolean(config.exchangePolicyText);
  const hasReturn = Boolean(config.returnPolicyText);

  return (
    <div className="border-border/60 divide-border/60 divide-y rounded-2xl border">
      {/* Installments */}
      {bestLabel && (
        <div className="flex items-start gap-3 p-4">
          <PackageCheckIcon className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Parcelamento</p>
            <p className="text-muted-foreground text-sm">{bestLabel}</p>
          </div>
        </div>
      )}

      {/* Exchange policy */}
      {hasExchange && (
        <div className="flex items-start gap-3 p-4">
          <ArrowLeftRightIcon className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Troca</p>
            <p className="text-muted-foreground text-sm">
              {config.exchangePolicyText}
            </p>
          </div>
        </div>
      )}

      {/* Return policy */}
      {hasReturn && (
        <div className="flex items-start gap-3 p-4">
          <RefreshCcwIcon className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Devolução em {config.returnPolicyDays} dias
            </p>
            <p className="text-muted-foreground text-sm">
              {config.returnPolicyText}
            </p>
          </div>
        </div>
      )}

      {/* Payment methods */}
      {config.paymentMethods.length > 0 && (
        <div className="p-4">
          <p className="text-muted-foreground mb-3 text-xs uppercase tracking-wide">
            Formas de pagamento
          </p>
          <div className="flex flex-wrap gap-2">
            {config.paymentMethods.map((method) => (
              <div
                key={method}
                className="relative h-8 w-12 overflow-hidden rounded"
                title={PAYMENT_METHOD_LABELS[method]}
              >
                <Image
                  src={`/payment-icons/${method}.svg`}
                  alt={PAYMENT_METHOD_LABELS[method] ?? method}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
