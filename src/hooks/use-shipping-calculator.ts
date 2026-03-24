"use client";

import { useEffect, useState } from "react";

import {
  formatPostalCode,
  LAST_POSTAL_CODE_STORAGE_KEY,
  normalizePostalCode,
  type ShippingOption,
  shippingOptionsResponseSchema,
} from "@/lib/shipping-schema";

type UseShippingCalculatorParams = {
  productId: string;
  quantity?: number;
};

type UseShippingCalculatorResult = {
  postalCode: string;
  setPostalCode: (postalCode: string) => void;
  results: ShippingOption[];
  isLoading: boolean;
  error: string | null;
  calculate: () => Promise<ShippingOption[]>;
  reset: () => void;
};

export function useShippingCalculator({
  productId,
  quantity = 1,
}: UseShippingCalculatorParams): UseShippingCalculatorResult {
  const [postalCode, setPostalCodeState] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_POSTAL_CODE_STORAGE_KEY);
    if (stored) {
      setPostalCodeState(formatPostalCode(stored));
    }
  }, []);
  const [results, setResults] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postalCode: normalizedPostalCode,
          productId,
          quantity,
        }),
      });
      const responseJson = await response.json().catch(() => null);

      if (!response.ok) {
        setResults([]);
        setError(
          typeof responseJson?.message === "string"
            ? responseJson.message
            : "Nao foi possivel calcular o frete. Tente novamente.",
        );
        return [];
      }

      const parsedResults = shippingOptionsResponseSchema.parse(responseJson);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LAST_POSTAL_CODE_STORAGE_KEY,
          normalizedPostalCode,
        );
      }

      if (parsedResults.length === 0) {
        setResults([]);
        setError("Nenhuma opcao de frete encontrada para este CEP.");
        return [];
      }

      setResults(parsedResults);
      setError(null);
      return parsedResults;
    } catch {
      setResults([]);
      setError("Nao foi possivel calcular o frete. Tente novamente.");
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
