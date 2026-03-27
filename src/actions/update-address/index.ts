"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type UpdateAddressInput, updateAddressSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function updateAddress(
  input: UpdateAddressInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = updateAddressSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const {
    addressId,
    label,
    recipientName,
    phone,
    zipCode,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    isDefault,
  } = payload.data;

  const existing = await db.query.shippingAddressTable.findFirst({
    where: and(
      eq(shippingAddressTable.id, addressId),
      eq(shippingAddressTable.userId, session.user.id),
    ),
    columns: { id: true },
  });

  if (!existing) {
    return { success: false, message: "Endereço não encontrado." };
  }

  if (isDefault) {
    await db
      .update(shippingAddressTable)
      .set({ isDefault: false })
      .where(eq(shippingAddressTable.userId, session.user.id));
  }

  await db
    .update(shippingAddressTable)
    .set({
      label,
      isDefault,
      recipientName,
      phone,
      zipCode,
      street,
      number,
      complement: complement || null,
      neighborhood,
      city,
      state,
    })
    .where(
      and(
        eq(shippingAddressTable.id, addressId),
        eq(shippingAddressTable.userId, session.user.id),
      ),
    );

  revalidatePath("/");

  return { success: true, message: "Endereço atualizado." };
}
