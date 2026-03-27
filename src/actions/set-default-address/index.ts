"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import {
  type SetDefaultAddressInput,
  setDefaultAddressSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function setDefaultAddress(
  input: SetDefaultAddressInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = setDefaultAddressSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { addressId } = payload.data;

  const address = await db.query.shippingAddressTable.findFirst({
    where: and(
      eq(shippingAddressTable.id, addressId),
      eq(shippingAddressTable.userId, session.user.id),
    ),
    columns: { id: true },
  });

  if (!address) {
    return { success: false, message: "Endereço não encontrado." };
  }

  await db
    .update(shippingAddressTable)
    .set({ isDefault: false })
    .where(eq(shippingAddressTable.userId, session.user.id));

  await db
    .update(shippingAddressTable)
    .set({ isDefault: true })
    .where(eq(shippingAddressTable.id, addressId));

  revalidatePath("/");

  return { success: true, message: "Endereço padrão atualizado." };
}
