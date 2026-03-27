"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { logisticsConfigTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpsertLogisticsConfigInput,
  upsertLogisticsConfigSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function upsertLogisticsConfig(
  input: UpsertLogisticsConfigInput,
): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = upsertLogisticsConfigSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const values = {
    maxInstallments: payload.data.maxInstallments,
    minInstallmentValueInCents: payload.data.minInstallmentValueInCents,
    freeInstallmentsUpTo: payload.data.freeInstallmentsUpTo,
    interestRatePercent: payload.data.interestRatePercent,
    returnPolicyDays: payload.data.returnPolicyDays,
    exchangePolicyText: payload.data.exchangePolicyText ?? null,
    returnPolicyText: payload.data.returnPolicyText ?? null,
    paymentMethods: payload.data.paymentMethods,
    updatedAt: new Date(),
  };

  if (payload.data.id) {
    await db
      .update(logisticsConfigTable)
      .set(values)
      .where(eq(logisticsConfigTable.id, payload.data.id));
  } else {
    const existing = await db.query.logisticsConfigTable.findFirst({
      columns: { id: true },
    });

    if (existing) {
      await db
        .update(logisticsConfigTable)
        .set(values)
        .where(eq(logisticsConfigTable.id, existing.id));
    } else {
      await db.insert(logisticsConfigTable).values(values);
    }
  }

  revalidatePath("/admin/configuracoes/logistica");
  revalidatePath("/product", "layout");

  return { success: true, message: "Configurações de logística salvas." };
}
