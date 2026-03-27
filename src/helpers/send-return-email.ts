import nodemailer from "nodemailer";

type SendReturnDecisionEmailParams = {
  toEmail: string;
  toName: string;
  orderId: string;
  decision: "approved" | "rejected";
  adminNote: string;
  returnCode?: string;
  returnUrl?: string;
};

export async function sendReturnDecisionEmail(
  params: SendReturnDecisionEmailParams,
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) return;

  const shortId = params.orderId.slice(0, 8).toUpperCase();

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  if (params.decision === "approved") {
    const trackingLines = params.returnCode
      ? `\nCódigo de postagem: ${params.returnCode}${params.returnUrl ? `\nInstruções: ${params.returnUrl}` : ""}`
      : "";

    await transporter.sendMail({
      from: `"Alexo" <${smtpFrom}>`,
      to: params.toEmail,
      subject: `[Alexo] Sua devolução foi aprovada! 🎉`,
      text: [
        `Olá ${params.toName},`,
        ``,
        `Sua solicitação de devolução do pedido #${shortId} foi aprovada.`,
        ``,
        `Como enviar o produto:`,
        trackingLines,
        ``,
        params.adminNote,
        ``,
        `Após recebermos o item, processaremos o reembolso.`,
        ``,
        `Atenciosamente,`,
        `Equipe Alexo`,
      ].join("\n"),
      html: `
        <p>Olá <strong>${params.toName}</strong>,</p>
        <p>Sua solicitação de devolução do pedido <strong>#${shortId}</strong> foi <strong>aprovada</strong>. 🎉</p>
        <h3>Como enviar o produto:</h3>
        ${params.returnCode ? `<p><strong>Código de postagem:</strong> ${params.returnCode}</p>` : ""}
        ${params.returnUrl ? `<p><a href="${params.returnUrl}">Ver instruções de postagem →</a></p>` : ""}
        <p>${params.adminNote.replace(/\n/g, "<br>")}</p>
        <hr />
        <p>Após recebermos o item, processaremos o reembolso.</p>
        <p>Atenciosamente,<br>Equipe Alexo</p>
      `,
    });
  } else {
    await transporter.sendMail({
      from: `"Alexo" <${smtpFrom}>`,
      to: params.toEmail,
      subject: `[Alexo] Atualização sobre sua solicitação de devolução`,
      text: [
        `Olá ${params.toName},`,
        ``,
        `Infelizmente não foi possível aprovar sua solicitação de devolução do pedido #${shortId}.`,
        ``,
        `Motivo: ${params.adminNote}`,
        ``,
        `Em caso de dúvidas, entre em contato conosco.`,
        ``,
        `Atenciosamente,`,
        `Equipe Alexo`,
      ].join("\n"),
      html: `
        <p>Olá <strong>${params.toName}</strong>,</p>
        <p>Infelizmente não foi possível aprovar sua solicitação de devolução do pedido <strong>#${shortId}</strong>.</p>
        <p><strong>Motivo:</strong> ${params.adminNote.replace(/\n/g, "<br>")}</p>
        <hr />
        <p>Em caso de dúvidas, entre em contato conosco.</p>
        <p>Atenciosamente,<br>Equipe Alexo</p>
      `,
    });
  }
}
