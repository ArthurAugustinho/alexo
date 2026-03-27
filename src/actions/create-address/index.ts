"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type CreateAddressInput, createAddressSchema } from "./schema";

type Result = { success: boolean; message: string; id?: string };

export async function createAddress(
  input: CreateAddressInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = createAddressSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const {
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

  const existing = await db.query.shippingAddressTable.findMany({
    where: eq(shippingAddressTable.userId, session.user.id),
    columns: { id: true },
  });

  const isFirstAddress = existing.length === 0;
  const shouldSetDefault = isDefault || isFirstAddress;

  if (shouldSetDefault && existing.length > 0) {
    await db
      .update(shippingAddressTable)
      .set({ isDefault: false })
      .where(eq(shippingAddressTable.userId, session.user.id));
  }

  const [newAddress] = await db
    .insert(shippingAddressTable)
    .values({
      userId: session.user.id,
      label,
      isDefault: shouldSetDefault,
      recipientName,
      phone,
      zipCode,
      street,
      number,
      complement: complement || null,
      neighborhood,
      city,
      state,
      country: "Brasil",
      email: "",
      cpfOrCnpj: "",
    })
    .returning({ id: shippingAddressTable.id });

  revalidatePath("/");

  return {
    success: true,
    message: "Endereço criado com sucesso.",
    id: newAddress?.id,
  };
}
