"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type UpdateProfileInput, updateProfileSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function updateProfile(input: UpdateProfileInput): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = updateProfileSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db
    .update(userTable)
    .set({
      name: payload.data.name,
      phone: payload.data.phone || null,
      birthDate: payload.data.birthDate || null,
      gender: payload.data.gender || null,
      cpf: payload.data.cpf || null,
      ...(payload.data.emailMarketing !== undefined && {
        emailMarketing: payload.data.emailMarketing,
      }),
      ...(payload.data.whatsappMarketing !== undefined && {
        whatsappMarketing: payload.data.whatsappMarketing,
      }),
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, session.user.id));

  revalidatePath("/");

  return { success: true, message: "Perfil atualizado com sucesso." };
}
