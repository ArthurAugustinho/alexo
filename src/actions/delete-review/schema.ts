import { z } from "zod";

export const deleteReviewSchema = z.object({
  reviewId: z.uuid("Avaliação inválida."),
});

export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
