"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import {
  getAdminRegistrationRole,
  isAdminRegistrationConfigured,
} from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

import {
  type RegisterAdminUserInput,
  registerAdminUserSchema,
} from "./schema";

type RegisterAdminUserResult = {
  success: boolean;
  message: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "body" in error &&
    error.body &&
    typeof error.body === "object" &&
    "message" in error.body &&
    typeof error.body.message === "string"
  ) {
    return error.body.message;
  }

  return "Não foi possível criar a conta administrativa.";
}

export async function registerAdminUser(
  input: RegisterAdminUserInput,
): Promise<RegisterAdminUserResult> {
  const payload = registerAdminUserSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!isAdminRegistrationConfigured()) {
    return {
      success: false,
      message:
        "O cadastro administrativo ainda não foi configurado no ambiente.",
    };
  }

  const adminRole = getAdminRegistrationRole(
    payload.data.email,
    payload.data.accessKey,
  );

  if (!adminRole) {
    return {
      success: false,
      message:
        "Este e-mail não possui permissão para cadastro administrativo.",
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: payload.data.name,
        email: payload.data.email,
        password: payload.data.password,
      },
      headers: await headers(),
    });

    await db
      .update(userTable)
      .set({
        role: adminRole,
      })
      .where(eq(userTable.email, payload.data.email.trim().toLowerCase()));

    return {
      success: true,
      message: "Conta admin criada. Faça login para continuar.",
    };
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes("USER_ALREADY_EXISTS")) {
      return {
        success: false,
        message: "Este e-mail já está cadastrado.",
      };
    }

    return {
      success: false,
      message,
    };
  }
}
