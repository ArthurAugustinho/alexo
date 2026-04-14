"use client";

import { useMutation } from "@tanstack/react-query";

export type ProductImportResult = {
  productName: string;
  status: "imported" | "skipped" | "failed";
  variantsCount?: number;
  message?: string;
};

export type ImportProductsResponse = {
  imported: number;
  skipped: number;
  failed: number;
  results: ProductImportResult[];
};

export const getImportProductsMutationKey = () => ["import-products"];

export const useImportProducts = () =>
  useMutation({
    mutationKey: getImportProductsMutationKey(),
    mutationFn: async (file: File): Promise<ImportProductsResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/import-products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Erro ao importar produtos.",
        );
      }

      return data as ImportProductsResponse;
    },
  });
