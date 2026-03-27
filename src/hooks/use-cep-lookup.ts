"use client";

import { useState } from "react";

export type CepData = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const useCepLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (cep: string): Promise<CepData | null> => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cep/${cleaned}`);
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "CEP não encontrado");
        return null;
      }
      return (await response.json()) as CepData;
    } catch {
      setError("Erro ao buscar CEP");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookup, isLoading, error };
};
