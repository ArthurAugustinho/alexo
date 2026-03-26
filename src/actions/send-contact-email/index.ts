"use server";

import nodemailer from "nodemailer";

import { db } from "@/db";

import {
  type SendContactEmailInput,
  sendContactEmailSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function sendContactEmail(
  input: SendContactEmailInput,
): Promise<ActionResult> {
  const payload = sendContactEmailSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const config = await db.query.supportWidgetConfigTable.findFirst();

  if (!config?.supportEmail) {
    return {
      success: false,
      message: "Serviço de contato não configurado.",
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return {
      success: false,
      message: "Serviço de email não configurado. Tente novamente mais tarde.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"${payload.data.name}" <${smtpFrom}>`,
    replyTo: payload.data.email,
    to: config.supportEmail,
    subject: `[Contato Alexo] ${payload.data.subject}`,
    text: [
      `Nome: ${payload.data.name}`,
      `Email: ${payload.data.email}`,
      `Assunto: ${payload.data.subject}`,
      "",
      payload.data.message,
    ].join("\n"),
    html: `
      <p><strong>Nome:</strong> ${payload.data.name}</p>
      <p><strong>Email:</strong> ${payload.data.email}</p>
      <p><strong>Assunto:</strong> ${payload.data.subject}</p>
      <hr />
      <p>${payload.data.message.replace(/\n/g, "<br>")}</p>
    `,
  });

  return { success: true, message: "Mensagem enviada com sucesso." };
}
