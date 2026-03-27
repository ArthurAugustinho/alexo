export type InstallmentOption = {
  installments: number;
  amountPerInstallment: number;
  totalAmount: number;
  hasInterest: boolean;
};

type CalculateInstallmentsParams = {
  priceInCents: number;
  maxInstallments: number;
  minInstallmentValueInCents: number;
  freeInstallmentsUpTo: number;
  interestRatePercent: number;
};

export function calculateInstallments({
  priceInCents,
  maxInstallments,
  minInstallmentValueInCents,
  freeInstallmentsUpTo,
  interestRatePercent,
}: CalculateInstallmentsParams): InstallmentOption[] {
  const options: InstallmentOption[] = [];

  for (let n = 1; n <= maxInstallments; n++) {
    const hasInterest = n > freeInstallmentsUpTo && interestRatePercent > 0;
    let totalAmount: number;
    let amountPerInstallment: number;

    if (hasInterest) {
      const rate = interestRatePercent / 100;
      const factor = (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
      amountPerInstallment = Math.ceil(priceInCents * factor);
      totalAmount = amountPerInstallment * n;
    } else {
      amountPerInstallment = Math.ceil(priceInCents / n);
      totalAmount = priceInCents;
    }

    if (amountPerInstallment < minInstallmentValueInCents) {
      break;
    }

    options.push({ installments: n, amountPerInstallment, totalAmount, hasInterest });
  }

  return options;
}

export function getBestInstallmentLabel(
  options: InstallmentOption[],
): string | null {
  if (options.length === 0) return null;

  const best = options[options.length - 1];
  if (!best) return null;

  const amountStr = (best.amountPerInstallment / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  if (best.installments === 1) {
    return amountStr;
  }

  const suffix = best.hasInterest ? "" : " sem juros";
  return `${best.installments}x de ${amountStr}${suffix}`;
}
