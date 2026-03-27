import { z } from "zod";

export const approveReviewSchema = z.object({
  reviewId: z.uuid("Avaliação inválida."),
});

export type ApproveReviewInput = z.infer<typeof approveReviewSchema>;
