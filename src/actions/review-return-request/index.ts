"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { returnRequestTable } from "@/db/schema";
import { sendReturnDecisionEmail } from "@/helpers/send-return-email";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ReviewReturnRequestInput,
  reviewReturnRequestSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function reviewReturnRequest(
  input: ReviewReturnRequestInput,
): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = reviewReturnRequestSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { returnRequestId, status, adminNote, returnCode, returnUrl } =
    payload.data;

  const request = await db.query.returnRequestTable.findFirst({
    where: eq(returnRequestTable.id, returnRequestId),
    columns: { id: true, orderId: true },
    with: {
      user: { columns: { name: true, email: true } },
    },
  });

  if (!request) {
    return { success: false, message: "Solicitação não encontrada." };
  }

  await db
    .update(returnRequestTable)
    .set({
      status,
      adminNote,
      returnCode: returnCode || null,
      returnUrl: returnUrl || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(returnRequestTable.id, returnRequestId));

  await sendReturnDecisionEmail({
    toEmail: request.user.email,
    toName: request.user.name,
    orderId: request.orderId,
    decision: status,
    adminNote,
    returnCode: returnCode || undefined,
    returnUrl: returnUrl || undefined,
  });

  revalidatePath("/");
  revalidatePath("/admin/devolucoes");

  return {
    success: true,
    message:
      status === "approved"
        ? "Devolução aprovada e cliente notificado."
        : "Devolução rejeitada e cliente notificado.",
  };
}
