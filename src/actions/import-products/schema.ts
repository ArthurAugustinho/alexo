import { z } from "zod";

const MAX_SIZE = 5 * 1024 * 1024;

export const importProductsFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "O arquivo não pode estar vazio.")
  .refine((f) => f.size <= MAX_SIZE, "Arquivo muito grande. Máximo 5MB.")
  .refine(
    (f) => f.name.toLowerCase().endsWith(".csv"),
    "O arquivo deve ter extensão .csv.",
  );
