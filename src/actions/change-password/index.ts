"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { type ChangePasswordInput, changePasswordSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function changePassword(input: ChangePasswordInput): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const payload = changePasswordSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: payload.data.currentPassword,
        newPassword: payload.data.newPassword,
      },
    });

    return { success: true, message: "Senha alterada com sucesso." };
  } catch {
    return {
      success: false,
      message: "Senha atual incorreta ou erro ao alterar senha.",
    };
  }
}
