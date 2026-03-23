"use client";

import { useMemo, useState } from "react";

import {
  formatPostalCode,
  LAST_POSTAL_CODE_STORAGE_KEY,
  normalizePostalCode,
  type ShippingOption,
  shippingOptionsResponseSchema,
} from "@/lib/shipping-schema";

export type ShippingCartItem = {
  productId: string;
  quantity: number;
};

type UseShippingCalculatorCartParams = {
  items: ShippingCartItem[];
};

type UseShippingCalculatorCartResult = {
  postalCode: string;
  setPostalCode: (postalCode: string) => void;
  results: ShippingOption[];
  isLoading: boolean;
  error: string | null;
  calculate: () => Promise<ShippingOption[]>;
  reset: () => void;
};

function getInitialPostalCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return formatPostalCode(
    window.localStorage.getItem(LAST_POSTAL_CODE_STORAGE_KEY) ?? "",
  );
}

export function useShippingCalculatorCart({
  items,
}: UseShippingCalculatorCartParams): UseShippingCalculatorCartResult {
  const [postalCode, setPostalCodeState] = useState(getInitialPostalCode);
  const [results, setResults] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aggregatedItems = useMemo(() => {
    return Array.from(
      items.reduce((map, item) => {
        const currentQuantity = map.get(item.productId) ?? 0;

        map.set(item.productId, currentQuantity + item.quantity);

        return map;
      }, new Map<string, number>()),
    ).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }, [items]);

  function setPostalCode(nextPostalCode: string) {
    setPostalCodeState(nextPostalCode);
  }

  async function calculate() {
    const normalizedPostalCode = normalizePostalCode(postalCode);

    if (!/^\d{8}$/.test(normalizedPostalCode)) {
      setResults([]);
      setError("CEP invalido");
      return [];
    }

    if (aggregatedItems.length === 0) {
      setResults([]);
      setError("Nao ha itens no carrinho para calcular o frete.");
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        aggregatedItems.map(async (item) => {
          const response = await fetch("/api/shipping/calculate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              postalCode: normalizedPostalCode,
              productId: item.productId,
              quantity: item.quantity,
            }),
          });
          const responseJson = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(
              typeof responseJson?.message === "string"
                ? responseJson.message
                : "Nao foi possivel calcular o frete. Tente novamente.",
            );
          }

          return shippingOptionsResponseSchema.parse(responseJson);
        }),
      );

      // Estrategia adotada no carrinho:
      // mantemos apenas os servicos disponiveis para todos os produtos,
      // somamos seus valores e usamos o maior prazo entre eles.
      const aggregatedResults = responses.reduce<Map<number, ShippingOption>>(
        (currentMap, shippingOptions, index) => {
          const nextMap = new Map<number, ShippingOption>();

          if (index === 0) {
            for (const option of shippingOptions) {
              nextMap.set(option.id, {
                ...option,
              });
            }

            return nextMap;
          }

          for (const option of shippingOptions) {
            const existingOption = currentMap.get(option.id);

            if (!existingOption) {
              continue;
            }

            nextMap.set(option.id, {
              ...existingOption,
              price: Number(
                ((existingOption.priceInCents + option.priceInCents) / 100).toFixed(
                  2,
                ),
              ),
              priceInCents: existingOption.priceInCents + option.priceInCents,
              deliveryTime: Math.max(
                existingOption.deliveryTime,
                option.deliveryTime,
              ),
            });
          }

          return nextMap;
        },
        new Map<number, ShippingOption>(),
      );

      const parsedResults = Array.from(aggregatedResults.values()).sort(
        (first, second) => first.priceInCents - second.priceInCents,
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LAST_POSTAL_CODE_STORAGE_KEY,
          normalizedPostalCode,
        );
      }

      if (parsedResults.length === 0) {
        setResults([]);
        setError("Nenhuma opcao de frete em comum foi encontrada para o carrinho.");
        return [];
      }

      setResults(parsedResults);
      setError(null);
      return parsedResults;
    } catch (caughtError) {
      setResults([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel calcular o frete. Tente novamente.",
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResults([]);
    setError(null);
  }

  return {
    postalCode,
    setPostalCode,
    results,
    isLoading,
    error,
    calculate,
    reset,
  };
}
