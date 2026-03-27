"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { returnRequestTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import {
  type CancelReturnRequestInput,
  cancelReturnRequestSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function cancelReturnRequest(
  input: CancelReturnRequestInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = cancelReturnRequestSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const request = await db.query.returnRequestTable.findFirst({
    where: eq(returnRequestTable.id, payload.data.returnRequestId),
    columns: { id: true, userId: true, status: true },
  });

  if (!request) {
    return { success: false, message: "Solicitação não encontrada." };
  }

  if (request.userId !== session.user.id) {
    return { success: false, message: "Não autorizado." };
  }

  if (request.status !== "pending_review") {
    return {
      success: false,
      message: "Esta solicitação não pode mais ser cancelada.",
    };
  }

  await db
    .delete(returnRequestTable)
    .where(eq(returnRequestTable.id, payload.data.returnRequestId));

  revalidatePath("/");

  return { success: true, message: "Solicitação cancelada." };
}
