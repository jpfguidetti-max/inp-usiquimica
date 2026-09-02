import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EmailType } from "@prisma/client";

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export type SendEmailParams = {
  to: string[];
  subject: string;
  html: string;
  iniciativaId: string;
  stepInstanceId?: string | null;
  type: EmailType;
};

/**
 * Sends a transactional email via Resend, and ALWAYS writes an EmailLog row
 * regardless of success/failure — including when RESEND_API_KEY is not
 * configured, so the app never crashes and every notification attempt is
 * auditable even before Resend is set up.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, iniciativaId, stepInstanceId, type } = params;
  const recipients = Array.from(new Set(to.filter(Boolean)));

  if (recipients.length === 0) {
    await prisma.emailLog.create({
      data: {
        iniciativaId,
        stepInstanceId: stepInstanceId ?? null,
        type,
        recipients: [],
        subject,
        success: false,
        error: "Nenhum destinatário definido",
      },
    });
    return;
  }

  const resend = getClient();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    await prisma.emailLog.create({
      data: {
        iniciativaId,
        stepInstanceId: stepInstanceId ?? null,
        type,
        recipients,
        subject,
        success: false,
        error: "RESEND_API_KEY não configurado",
      },
    });
    return;
  }

  try {
    const result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });

    if (result.error) {
      await prisma.emailLog.create({
        data: {
          iniciativaId,
          stepInstanceId: stepInstanceId ?? null,
          type,
          recipients,
          subject,
          success: false,
          error: result.error.message ?? "Erro desconhecido do Resend",
        },
      });
      return;
    }

    await prisma.emailLog.create({
      data: {
        iniciativaId,
        stepInstanceId: stepInstanceId ?? null,
        type,
        recipients,
        subject,
        success: true,
      },
    });
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        iniciativaId,
        stepInstanceId: stepInstanceId ?? null,
        type,
        recipients,
        subject,
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido ao enviar email",
      },
    });
  }
}
