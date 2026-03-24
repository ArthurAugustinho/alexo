"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { cartTable, shippingAddressTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const createShippingAddressSchema = z.object({
  email: z.email("E-mail inválido"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(14, "CPF inválido"),
  phone: z.string().min(15, "Celular inválido"),
  zipCode: z.string().min(9, "CEP inválido"),
  address: z.string().min(1, "Endereço é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
});

const updateCartShippingAddressSchema = z.object({
  shippingAddressId: z.string().uuid(),
});

export type CreateShippingAddressInput = z.infer<
  typeof createShippingAddressSchema
>;
export type UpdateCartShippingAddressInput = z.infer<
  typeof updateCartShippingAddressSchema
>;

export const createShippingAddress = async (
  data: CreateShippingAddressInput,
) => {
  createShippingAddressSchema.parse(data);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

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

export const getUserAddresses = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Usuário não autenticado");

  return db
    .select()
    .from(shippingAddressTable)
    .where(eq(shippingAddressTable.userId, session.user.id))
    .orderBy(shippingAddressTable.createdAt);
};

export const updateCartShippingAddress = async (
  data: UpdateCartShippingAddressInput,
) => {
  updateCartShippingAddressSchema.parse(data);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const shippingAddress = await db.query.shippingAddressTable.findFirst({
    where: (address, { eq }) => eq(address.id, data.shippingAddressId),
  });
  if (!shippingAddress) throw new Error("Endereço não encontrado.");
  if (shippingAddress.userId !== session.user.id)
    throw new Error("Unauthorized");

  const cart = await db.query.cartTable.findFirst({
    where: (cart, { eq }) => eq(cart.userId, session.user.id),
  });

  let cartId = cart?.id;
  if (!cartId) {
    const [newCart] = await db
      .insert(cartTable)
      .values({ userId: session.user.id })
      .returning();
    cartId = newCart.id;
  }

  await db
    .update(cartTable)
    .set({ shippingAddressId: shippingAddress.id })
    .where(eq(cartTable.id, cartId));

  revalidatePath("/cart/identification");
  revalidatePath("/cart/confirmation");
};
