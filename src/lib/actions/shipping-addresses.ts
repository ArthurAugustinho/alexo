"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  type CreateShippingAddressSchema,
  createShippingAddressSchema,
} from "@/lib/shipping-address-schema";

export const createShippingAddress = async (
  data: CreateShippingAddressSchema,
) => {
  createShippingAddressSchema.parse(data);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const [shippingAddress] = await db
    .insert(shippingAddressTable)
    .values({
      userId: session.user.id,
      recipientName: data.fullName,
      street: data.address,
      number: data.number,
      complement: data.complement || null,
      city: data.city,
      state: data.state,
      neighborhood: data.neighborhood,
      zipCode: data.zipCode,
      country: "Brasil",
      phone: data.phone,
      email: data.email,
      cpfOrCnpj: data.cpf,
    })
    .returning();

  revalidatePath("/cart/identification");

  return shippingAddress;
};

export async function getUserAddresses() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("UsuÃ¡rio nÃ£o autenticado");
  }

  try {
    const addresses = await db
      .select()
      .from(shippingAddressTable)
      .where(eq(shippingAddressTable.userId, session.user.id))
      .orderBy(shippingAddressTable.createdAt);

    return addresses;
  } catch (error) {
    console.error("Erro ao buscar endereÃ§os:", error);
    throw new Error("Erro ao buscar endereÃ§os");
  }
}
