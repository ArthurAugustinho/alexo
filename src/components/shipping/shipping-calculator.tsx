"use client";

import { Loader2Icon, MapPinIcon, TruckIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PatternFormat } from "react-number-format";

import { formatCentsToBRL } from "@/helpers/money";
import { useShippingCalculator } from "@/hooks/use-shipping-calculator";
import {
  type ShippingCartItem,
  useShippingCalculatorCart,
} from "@/hooks/use-shipping-calculator-cart";
import { type ShippingOption } from "@/lib/shipping-schema";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

type ProductShippingCalculatorProps = {
  productId: string;
  quantity?: number;
  className?: string;
  note?: string;
  selectedOptionId?: number | null;
  onOptionSelect?: (option: ShippingOption | null) => void;
};

type CartShippingCalculatorProps = {
  items: ShippingCartItem[];
  className?: string;
  note?: string;
  selectedOptionId?: number | null;
  onOptionSelect?: (option: ShippingOption | null) => void;
};

type ShippingCalculatorContentProps = {
  className?: string;
  note?: string;
  postalCode: string;
  setPostalCode: (postalCode: string) => void;
  results: ShippingOption[];
  isLoading: boolean;
  error: string | null;
  calculate: () => Promise<ShippingOption[]>;
  reset: () => void;
  selectedOptionId?: number | null;
  onOptionSelect?: (option: ShippingOption | null) => void;
};

function ShippingCalculatorContent({
  className,
  note,
  postalCode,
  setPostalCode,
  results,
  isLoading,
  error,
  calculate,
  reset,
  selectedOptionId,
  onOptionSelect,
}: ShippingCalculatorContentProps) {
  async function handleCalculateClick() {
    onOptionSelect?.(null);
    await calculate();
  }

  function handleReset() {
    reset();
    onOptionSelect?.(null);
  }

  return (
    <section className={cn("space-y-4 rounded-3xl border p-4", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Calcular frete</h3>
        {note ? (
          <p className="text-muted-foreground text-xs">{note}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <PatternFormat
          format="#####-###"
          mask="_"
          value={postalCode}
          onValueChange={(values) => setPostalCode(values.formattedValue)}
          customInput={Input}
          className="h-11 rounded-full px-4"
          placeholder="00000-000"
          aria-label="CEP de entrega"
        />

        <Button
          type="button"
          className="rounded-full sm:min-w-[120px]"
          onClick={handleCalculateClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <MapPinIcon className="size-4" />
          )}
          <span>Calcular</span>
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-xs">
        <Link
          href="https://buscacepinter.correios.com.br"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Nao sei meu CEP
        </Link>

        {(results.length > 0 || error) && !isLoading ? (
          <button
            type="button"
            className="text-primary font-medium"
            onClick={handleReset}
          >
            Alterar CEP
          </button>
        ) : null}
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`shipping-option-skeleton-${index}`}
              className="space-y-2 rounded-2xl border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-muted size-6 animate-pulse rounded-full" />
                  <div className="bg-muted h-4 w-32 animate-pulse rounded-full" />
                </div>
                <div className="bg-muted h-4 w-20 animate-pulse rounded-full" />
              </div>
              <div className="bg-muted h-4 w-28 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div
          className="space-y-3"
          role={onOptionSelect ? "radiogroup" : undefined}
          aria-label={onOptionSelect ? "Opcoes de frete" : undefined}
        >
          {results.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const optionContent = (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-6 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={option.logoUrl}
                      alt={option.company}
                      fill
                      sizes="24px"
                      className={
                        option.logoUrl.startsWith("/")
                          ? "object-cover"
                          : "object-contain"
                      }
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {option.name} - {option.company}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Prazo: ate {option.deliveryTime}{" "}
                      {option.deliveryTime === 1 ? "dia util" : "dias uteis"}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-sm font-semibold",
                    option.priceInCents === 0 && "text-emerald-600",
                  )}
                >
                  {option.priceInCents === 0
                    ? "Gratis"
                    : formatCentsToBRL(option.priceInCents)}
                </span>
              </div>
            );

            return onOptionSelect ? (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
                onClick={() => onOptionSelect(option)}
                role="radio"
                aria-checked={isSelected}
              >
                {optionContent}
              </button>
            ) : (
              <div key={option.id} className="w-full rounded-2xl border p-3">
                {optionContent}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <TruckIcon className="size-4" />
          <span>Informe o CEP para consultar as opcoes de entrega.</span>
        </div>
      )}
    </section>
  );
}

function ProductShippingCalculator({
  productId,
  quantity = 1,
  className,
  note,
  selectedOptionId,
  onOptionSelect,
}: ProductShippingCalculatorProps) {
  const calculator = useShippingCalculator({
    productId,
    quantity,
  });

  return (
    <ShippingCalculatorContent
      className={className}
      note={note}
      selectedOptionId={selectedOptionId}
      onOptionSelect={onOptionSelect}
      {...calculator}
    />
  );
}

function CartShippingCalculator({
  items,
  className,
  note,
  selectedOptionId,
  onOptionSelect,
}: CartShippingCalculatorProps) {
  const calculator = useShippingCalculatorCart({
    items,
  });

  return (
    <ShippingCalculatorContent
      className={className}
      note={note}
      selectedOptionId={selectedOptionId}
      onOptionSelect={onOptionSelect}
      {...calculator}
    />
  );
}

export function ShippingCalculator(
  props: ProductShippingCalculatorProps | CartShippingCalculatorProps,
) {
  if ("items" in props) {
    return <CartShippingCalculator {...props} />;
  }

  return <ProductShippingCalculator {...props} />;
}
