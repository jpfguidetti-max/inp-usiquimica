import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { businessDaysBetween } from "@/lib/businessDays";
import { sendEmail } from "@/lib/email/resend";
import { dia4Template, vencidaTemplate } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function handle(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const now = new Date();
  const holidays = await prisma.holiday.findMany();
  const admins = await prisma.user.findMany({ where: { isAdmin: true, active: true } });
  const adminEmails = admins.map((a) => a.email);

  const openSteps = await prisma.stepInstance.findMany({
    where: { status: "EM_ANDAMENTO" },
    include: {
      stepDefinition: true,
      assignee: true,
      iniciativa: { include: { requester: true } },
    },
  });

  let checked = 0;
  let day4Sent = 0;
  let overdueSent = 0;

  for (const step of openSteps) {
    checked += 1;
    const responsavelNome = step.assignee?.name ?? "responsável não definido";
    const recipients = new Set<string>(adminEmails);
    if (step.assignee?.email) recipients.add(step.assignee.email);
    if (step.iniciativa.requester?.email) recipients.add(step.iniciativa.requester.email);

    // --- Dia 4: fires once, when >=4 business days elapsed since startedAt ---
    if (!step.day4NotifiedAt) {
      const diasUteis = businessDaysBetween(step.startedAt, now, holidays);
      if (diasUteis >= 4) {
        const { subject, html } = dia4Template({
          code: step.iniciativa.code,
          productName: step.iniciativa.productName,
          stepLabel: step.stepDefinition.label,
          responsavelNome,
          diasUteis,
          iniciativaId: step.iniciativaId,
        });
        await sendEmail({
          to: Array.from(recipients),
          subject,
          html,
          iniciativaId: step.iniciativaId,
          stepInstanceId: step.id,
          type: "DIA4",
        });
        await prisma.stepInstance.update({
          where: { id: step.id },
          data: { day4NotifiedAt: now },
        });
        day4Sent += 1;
      }
    }

    // --- Vencida: fires at most once per calendar day, every day the step is overdue ---
    if (step.dueAt && now.getTime() > step.dueAt.getTime()) {
      const alreadyNotifiedToday =
        step.lastOverdueNotifiedAt && isSameCalendarDay(step.lastOverdueNotifiedAt, now);
      if (!alreadyNotifiedToday) {
        const { subject, html } = vencidaTemplate({
          code: step.iniciativa.code,
          productName: step.iniciativa.productName,
          stepLabel: step.stepDefinition.label,
          responsavelNome,
          dueAt: step.dueAt,
          iniciativaId: step.iniciativaId,
        });
        await sendEmail({
          to: Array.from(recipients),
          subject,
          html,
          iniciativaId: step.iniciativaId,
          stepInstanceId: step.id,
          type: "VENCIDA",
        });
        await prisma.stepInstance.update({
          where: { id: step.id },
          data: { lastOverdueNotifiedAt: now },
        });
        overdueSent += 1;
      }
    }
  }

  return NextResponse.json({ checked, day4Sent, overdueSent });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
