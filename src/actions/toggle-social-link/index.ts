"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { socialLinkTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type ToggleSocialLinkInput, toggleSocialLinkSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleSocialLink(
  input: ToggleSocialLinkInput,
): Promise<ActionResult> {
  const payload = toggleSocialLinkSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .update(socialLinkTable)
    .set({ isActive: payload.data.isActive })
    .where(eq(socialLinkTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return {
    success: true,
    message: payload.data.isActive ? "Link ativado." : "Link desativado.",
  };
}
