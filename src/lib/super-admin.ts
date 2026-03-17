import { randomUUID } from "node:crypto";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { accountTable, userTable } from "@/db/schema";

import { USER_ROLES } from "./admin-roles";

type ConfiguredSuperAdmin = {
  email: string;
  password: string;
  name: string;
};

function getConfiguredSuperAdmin(): ConfiguredSuperAdmin | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    name,
  };
}

export function getConfiguredSuperAdminEmail() {
  return getConfiguredSuperAdmin()?.email ?? null;
}

export function hasConfiguredSuperAdmin() {
  return getConfiguredSuperAdmin() !== null;
}

export async function syncConfiguredSuperAdmin() {
  const configuredSuperAdmin = getConfiguredSuperAdmin();

  if (!configuredSuperAdmin) {
    return null;
  }

  const now = new Date();
  const existingUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, configuredSuperAdmin.email),
  });

  if (!existingUser) {
    const userId = randomUUID();

    await db.insert(userTable).values({
      id: userId,
      name: configuredSuperAdmin.name,
      email: configuredSuperAdmin.email,
      role: USER_ROLES.SUPER_ADMIN,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(accountTable).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(configuredSuperAdmin.password),
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(userTable)
      .set({
        name: configuredSuperAdmin.name,
        role: USER_ROLES.SUPER_ADMIN,
        emailVerified: true,
        updatedAt: now,
      })
      .where(eq(userTable.id, existingUser.id));

    const credentialAccount = await db.query.accountTable.findFirst({
      where: and(
        eq(accountTable.userId, existingUser.id),
        eq(accountTable.providerId, "credential"),
      ),
    });

    if (!credentialAccount) {
      await db.insert(accountTable).values({
        id: randomUUID(),
        accountId: existingUser.id,
        providerId: "credential",
        userId: existingUser.id,
        password: await hashPassword(configuredSuperAdmin.password),
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const passwordMatches =
        credentialAccount.password &&
        (await verifyPassword({
          hash: credentialAccount.password,
          password: configuredSuperAdmin.password,
        }));

      if (!passwordMatches) {
        await db
          .update(accountTable)
          .set({
            password: await hashPassword(configuredSuperAdmin.password),
            updatedAt: now,
          })
          .where(eq(accountTable.id, credentialAccount.id));
      }
    }
  }

  await db
    .update(userTable)
    .set({
      role: USER_ROLES.ADMIN,
      updatedAt: now,
    })
    .where(
      and(
        eq(userTable.role, USER_ROLES.SUPER_ADMIN),
        ne(userTable.email, configuredSuperAdmin.email),
      ),
    );

  return {
    email: configuredSuperAdmin.email,
    name: configuredSuperAdmin.name,
  };
}
