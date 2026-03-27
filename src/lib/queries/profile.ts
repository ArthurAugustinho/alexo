"use server";

import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { userTable } from "@/db/schema";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  cpf: string | null;
  emailMarketing: boolean;
  whatsappMarketing: boolean;
  hasPassword: boolean;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  noStore();

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      birthDate: true,
      gender: true,
      cpf: true,
      emailMarketing: true,
      whatsappMarketing: true,
    },
  });

  if (!user) return null;

  const credentialAccount = await db.query.accountTable.findFirst({
    where: (t, { and, eq: eqFn }) =>
      and(eqFn(t.userId, userId), eqFn(t.providerId, "credential")),
    columns: { id: true },
  });

  return {
    ...user,
    hasPassword: !!credentialAccount,
  };
}
