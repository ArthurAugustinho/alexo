"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { socialLinkTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type UpsertSocialLinkInput, upsertSocialLinkSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function upsertSocialLink(
  input: UpsertSocialLinkInput,
): Promise<ActionResult> {
  const payload = upsertSocialLinkSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  const existing = await db.query.socialLinkTable.findFirst({
    where: eq(socialLinkTable.platform, payload.data.platform),
  });

  if (existing) {
    await db
      .update(socialLinkTable)
      .set({
        url: payload.data.url,
        isActive: payload.data.isActive,
        position: payload.data.position,
      })
      .where(eq(socialLinkTable.platform, payload.data.platform));
  } else {
    await db.insert(socialLinkTable).values({
      platform: payload.data.platform,
      url: payload.data.url,
      isActive: payload.data.isActive,
      position: payload.data.position,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Rede social salva com sucesso." };
}
