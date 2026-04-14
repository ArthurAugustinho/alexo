"use client";

import { useMutation } from "@tanstack/react-query";

import { importProducts } from "@/actions/import-products";
import type { ImportError } from "@/app/api/admin/import-products/route";

export type { ImportError };

export type ImportProductsSuccess = {
  success: true;
  imported: number;
  errors: ImportError[];
};

export const getImportProductsMutationKey = () => ["import-products"] as const;

export const useImportProducts = () =>
  useMutation({
    mutationKey: getImportProductsMutationKey(),
    mutationFn: async (file: File): Promise<ImportProductsSuccess> => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await importProducts(formData);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    },
  });
