"use server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { socialLinkTable } from "@/db/schema";

export type SocialLink = typeof socialLinkTable.$inferSelect;

export async function getActiveSocialLinks(): Promise<SocialLink[]> {
  return db.query.socialLinkTable.findMany({
    where: eq(socialLinkTable.isActive, true),
    orderBy: [asc(socialLinkTable.position)],
  });
}

export async function getAllSocialLinks(): Promise<SocialLink[]> {
  return db.query.socialLinkTable.findMany({
    orderBy: [asc(socialLinkTable.position)],
  });
}
