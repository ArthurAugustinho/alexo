"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { normalizeSearch } from "@/helpers/normalize-search";

const productSearchResultSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  imageUrl: z.string(),
});

const productSearchResultListSchema = z.array(productSearchResultSchema);

export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;

export function useProductSearch(query: string) {
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const normalizedQuery = normalizeSearch(query);

  useEffect(() => {
    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimeoutRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Nao foi possivel buscar os produtos.");
        }

        const payload = productSearchResultListSchema.parse(
          await response.json(),
        );

        if (!controller.signal.aborted) {
          setResults(payload);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [normalizedQuery]);

  const isEmpty =
    normalizedQuery.length >= 2 && !isLoading && results.length === 0;

  return {
    results,
    isLoading,
    isEmpty,
  };
}
