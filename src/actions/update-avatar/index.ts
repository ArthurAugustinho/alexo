"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type UpdateAvatarInput, updateAvatarSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function updateAvatar(input: UpdateAvatarInput): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = updateAvatarSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db
    .update(userTable)
    .set({ image: payload.data.imageUrl, updatedAt: new Date() })
    .where(eq(userTable.id, session.user.id));

  revalidatePath("/");

  return { success: true, message: "Foto atualizada com sucesso." };
}
