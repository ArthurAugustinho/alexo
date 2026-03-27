"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type DeleteAddressInput, deleteAddressSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function deleteAddress(
  input: DeleteAddressInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = deleteAddressSchema.safeParse(input);

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
    columns: { id: true, isDefault: true },
  });

  if (!address) {
    return { success: false, message: "Endereço não encontrado." };
  }

  const allAddresses = await db.query.shippingAddressTable.findMany({
    where: eq(shippingAddressTable.userId, session.user.id),
    columns: { id: true },
  });

  if (allAddresses.length <= 1) {
    return {
      success: false,
      message: "Você deve ter ao menos 1 endereço cadastrado.",
    };
  }

  await db
    .delete(shippingAddressTable)
    .where(
      and(
        eq(shippingAddressTable.id, addressId),
        eq(shippingAddressTable.userId, session.user.id),
      ),
    );

  if (address.isDefault) {
    const next = await db.query.shippingAddressTable.findFirst({
      where: and(
        eq(shippingAddressTable.userId, session.user.id),
        ne(shippingAddressTable.id, addressId),
      ),
      orderBy: [desc(shippingAddressTable.createdAt)],
      columns: { id: true },
    });

    if (next) {
      await db
        .update(shippingAddressTable)
        .set({ isDefault: true })
        .where(eq(shippingAddressTable.id, next.id));
    }
  }

  revalidatePath("/");

  return { success: true, message: "Endereço excluído." };
}
