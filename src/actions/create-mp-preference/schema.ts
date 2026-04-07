import { z } from "zod";

// Nenhum dado necessário do cliente — tudo vem da sessão e do carrinho no servidor
export const createMpPreferenceSchema = z.object({});

export type CreateMpPreferenceSchema = z.infer<typeof createMpPreferenceSchema>;
