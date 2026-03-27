"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { orderTable, returnRequestTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getReturnRequestByOrder } from "@/lib/queries/return-requests";

import {
  type CreateReturnRequestInput,
  createReturnRequestSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function createReturnRequest(
  input: CreateReturnRequestInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = createReturnRequestSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const order = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, payload.data.orderId),
    columns: { id: true, userId: true, status: true },
  });

  if (!order) {
    return { success: false, message: "Pedido não encontrado." };
  }

  if (order.userId !== session.user.id) {
    return { success: false, message: "Não autorizado." };
  }

  if (order.status !== "delivered") {
    return {
      success: false,
      message: "Apenas pedidos entregues podem ser devolvidos.",
    };
  }

  const existing = await getReturnRequestByOrder(payload.data.orderId);

  if (existing) {
    return {
      success: false,
      message: "Já existe uma solicitação de devolução para este pedido.",
    };
  }

  await db.insert(returnRequestTable).values({
    orderId: payload.data.orderId,
    userId: session.user.id,
    reason: payload.data.reason,
    description: payload.data.description,
    photoUrl: payload.data.photoUrl || null,
    status: "pending_review",
  });

  revalidatePath("/");

  return {
    success: true,
    message:
      "Solicitação enviada! O prazo de resposta é de até 3 dias úteis.",
  };
}
