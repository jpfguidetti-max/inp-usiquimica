import { prisma } from "@/lib/prisma";
import { addBusinessDays, businessDaysBetween } from "@/lib/businessDays";
import { sendEmail } from "@/lib/email/resend";
import { transicaoTemplate, gateRejectedTemplate } from "@/lib/email/templates";
import { AMOSTRAS_STEP_KEY, GATE_STEP_KEY } from "@/lib/stepDefinitions";
import type { Area, StepInstance, StepDefinition, User, Prisma } from "@prisma/client";

// A Prisma client OR an interactive-transaction client — every helper below
// accepts one of these so the core mutations (createIniciativa, completeStep)
// can run atomically inside a single prisma.$transaction(...), while reads
// used elsewhere (dashboard, lists) can keep using the plain client.
type Db = typeof prisma | Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getHolidays(db: Db = prisma) {
  return db.holiday.findMany();
}

async function getAdmins(db: Db): Promise<User[]> {
  return db.user.findMany({ where: { isAdmin: true, active: true } });
}

/**
 * Default assignee for a newly-created step: the requester for
 * SOLICITANTE-area steps, otherwise the area's titular (isBackup=false).
 * Returns null (unassigned) if no titular is configured for that area.
 */
async function defaultAssigneeForArea(db: Db, area: Area, requesterId: string): Promise<string | null> {
  if (area === "SOLICITANTE") return requesterId;
  const titular = await db.userArea.findFirst({
    where: { areaId: area, isBackup: false, user: { active: true } },
    include: { user: true },
  });
  return titular?.userId ?? null;
}

async function computeDueAt(db: Db, startedAt: Date, slaBusinessDays: number): Promise<Date> {
  const holidays = await getHolidays(db);
  return addBusinessDays(startedAt, slaBusinessDays, holidays);
}

async function stepDefByKey(db: Db, key: string): Promise<StepDefinition> {
  const def = await db.stepDefinition.findUnique({ where: { key } });
  if (!def) throw new Error(`StepDefinition não encontrada para key=${key}`);
  return def;
}

async function nextStepDefinitions(db: Db, currentOrder: number): Promise<StepDefinition[]> {
  const next = await db.stepDefinition.findFirst({
    where: { order: { gt: currentOrder } },
    orderBy: { order: "asc" },
  });
  if (!next) return [];
  if (next.parallelGroup) {
    return db.stepDefinition.findMany({
      where: { order: { gte: next.order ?? 0 }, parallelGroup: next.parallelGroup },
      orderBy: { order: "asc" },
    });
  }
  return [next];
}

async function createStepInstance(
  db: Db,
  iniciativaId: string,
  def: StepDefinition,
  requesterId: string,
  startedAt: Date = new Date()
): Promise<StepInstance & { assignee: User | null }> {
  const assignedUserId = await defaultAssigneeForArea(db, def.area, requesterId);
  const dueAt = await computeDueAt(db, startedAt, def.slaBusinessDays);
  return db.stepInstance.create({
    data: {
      iniciativaId,
      stepDefinitionId: def.id,
      status: "EM_ANDAMENTO",
      assignedUserId,
      startedAt,
      dueAt,
    },
    include: { assignee: true },
  });
}

async function audit(db: Db, iniciativaId: string, userId: string | null, action: string, details: string) {
  await db.auditLog.create({ data: { iniciativaId, userId, action, details } });
}

/** A pending "transição" email to send once the enclosing transaction has committed. */
type PendingTransicaoEmail = {
  iniciativaId: string;
  code: string;
  productName: string;
  stepAnteriorLabel: string;
  stepAtualLabel: string;
  responsavelNome: string;
  stepInstanceId: string;
  recipients: string[];
};

async function buildTransicaoEmails(
  db: Db,
  params: {
    iniciativaId: string;
    code: string;
    productName: string;
    stepAnteriorLabel: string;
    newInstances: (StepInstance & { assignee: User | null })[];
    requesterId: string;
  }
): Promise<PendingTransicaoEmail[]> {
  const { iniciativaId, code, productName, stepAnteriorLabel, newInstances, requesterId } = params;
  const admins = await getAdmins(db);
  const requester = await db.user.findUnique({ where: { id: requesterId } });

  const emails: PendingTransicaoEmail[] = [];
  for (const inst of newInstances) {
    const def = await db.stepDefinition.findUnique({ where: { id: inst.stepDefinitionId } });
    const responsavelNome = inst.assignee?.name ?? "responsável a definir";
    const recipients = new Set<string>();
    if (inst.assignee?.email) recipients.add(inst.assignee.email);
    if (requester?.email) recipients.add(requester.email);
    for (const a of admins) recipients.add(a.email);

    emails.push({
      iniciativaId,
      code,
      productName,
      stepAnteriorLabel,
      stepAtualLabel: def?.label ?? "",
      responsavelNome,
      stepInstanceId: inst.id,
      recipients: Array.from(recipients),
    });
  }
  return emails;
}

async function sendTransicaoEmails(emails: PendingTransicaoEmail[]): Promise<void> {
  for (const e of emails) {
    const { subject, html } = transicaoTemplate(e);
    await sendEmail({
      to: e.recipients,
      subject,
      html,
      iniciativaId: e.iniciativaId,
      stepInstanceId: e.stepInstanceId,
      type: "TRANSICAO",
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Generates the next sequential code for the given year, e.g. INP-2026-001. */
export async function generateIniciativaCode(year: number, db: Db = prisma): Promise<string> {
  const prefix = `INP-${year}-`;
  const last = await db.iniciativa.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
  });
  let n = 1;
  if (last) {
    const parts = last.code.split("-");
    const lastN = parseInt(parts[2], 10);
    if (!Number.isNaN(lastN)) n = lastN + 1;
  }
  return `${prefix}${String(n).padStart(3, "0")}`;
}

/**
 * Creates a new Iniciativa from the Fase 1 form. This simultaneously:
 *  - creates the Iniciativa
 *  - creates & completes the F1_BUSINESS_CASE StepInstance
 *  - opens the P1 parallel group (F1_QUALIDADE_REGULATORIO, F1_FABRICA_VIABILIDADE)
 *  - sends transição emails
 * All database writes happen inside a single transaction; emails are sent
 * only after it commits successfully.
 */
export async function createIniciativa(params: {
  requesterId: string;
  productName: string;
  fase1Data: Record<string, unknown>;
}) {
  const { requesterId, productName, fase1Data } = params;

  const { iniciativa, step1, pendingEmails } = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();
    const code = await generateIniciativaCode(year, tx);

    const iniciativa = await tx.iniciativa.create({
      data: {
        code,
        productName,
        requesterId,
        status: "ABERTA",
        fase1Data: fase1Data as Prisma.InputJsonValue,
      },
    });

    const now = new Date();
    const step1Def = await stepDefByKey(tx, "F1_BUSINESS_CASE");
    const dueAt = await computeDueAt(tx, now, step1Def.slaBusinessDays);

    const step1 = await tx.stepInstance.create({
      data: {
        iniciativaId: iniciativa.id,
        stepDefinitionId: step1Def.id,
        status: "CONCLUIDA",
        assignedUserId: requesterId,
        startedAt: now,
        dueAt,
        completedAt: now,
        completedById: requesterId,
      },
    });

    await audit(tx, iniciativa.id, requesterId, "INICIATIVA_CRIADA", `Iniciativa ${code} criada por preenchimento do Business Case (Fase 1).`);
    await audit(tx, iniciativa.id, requesterId, "STEP_CONCLUIDA", `Etapa "${step1Def.label}" concluída.`);

    const p1Defs = await tx.stepDefinition.findMany({
      where: { parallelGroup: "P1" },
      orderBy: { order: "asc" },
    });

    const newInstances: (StepInstance & { assignee: User | null })[] = [];
    for (const def of p1Defs) {
      const inst = await createStepInstance(tx, iniciativa.id, def, requesterId, now);
      newInstances.push(inst);
      await audit(
        tx,
        iniciativa.id,
        null,
        "STEP_INICIADA",
        `Etapa "${def.label}" iniciada, responsável: ${inst.assignee?.name ?? "sem responsável definido"}.`
      );
    }

    const pendingEmails = await buildTransicaoEmails(tx, {
      iniciativaId: iniciativa.id,
      code: iniciativa.code,
      productName: iniciativa.productName,
      stepAnteriorLabel: step1Def.label,
      newInstances,
      requesterId,
    });

    return { iniciativa, step1, pendingEmails };
  });

  await sendTransicaoEmails(pendingEmails);

  return { iniciativa, step1 };
}

export type CompleteStepParams = {
  stepInstanceId: string;
  userId: string;
  isAdmin: boolean;
  decision?: "GO" | "HOLD" | "NO_GO";
  decisionNote?: string;
  comment?: string;
};

export async function completeStep(params: CompleteStepParams): Promise<void> {
  const { stepInstanceId, userId, isAdmin, decision, decisionNote, comment } = params;

  const result = await prisma.$transaction(async (tx) => {
    const step = await tx.stepInstance.findUnique({
      where: { id: stepInstanceId },
      include: { stepDefinition: true, iniciativa: true },
    });
    if (!step) throw new Error("Etapa não encontrada.");
    if (step.status === "CONCLUIDA") throw new Error("Esta etapa já foi concluída.");

    const allowed = isAdmin || step.assignedUserId === userId;
    if (!allowed) throw new Error("Você não é o responsável por esta etapa.");

    if (step.stepDefinition.isGate && !decision) {
      throw new Error("É necessário informar a decisão do Gate (GO, HOLD ou NO-GO).");
    }
    if (decision && decision !== "GO" && !decisionNote?.trim()) {
      throw new Error("É necessário informar uma observação para decisões HOLD ou NO-GO.");
    }

    const now = new Date();

    await tx.stepInstance.update({
      where: { id: stepInstanceId },
      data: {
        status: "CONCLUIDA",
        completedAt: now,
        completedById: userId,
        decision: decision ?? null,
        decisionNote: decision && decision !== "GO" ? decisionNote : null,
      },
    });

    if (comment?.trim()) {
      await tx.comment.create({
        data: {
          stepInstanceId,
          iniciativaId: step.iniciativaId,
          userId,
          text: comment.trim(),
        },
      });
    }

    await audit(
      tx,
      step.iniciativaId,
      userId,
      "STEP_CONCLUIDA",
      `Etapa "${step.stepDefinition.label}" concluída.${decision ? ` Decisão: ${decision}.` : ""}`
    );

    // ---- Gate 1 rejection branch ----
    if (step.stepDefinition.key === GATE_STEP_KEY && decision && decision !== "GO") {
      const bcDef = await stepDefByKey(tx, "F1_BUSINESS_CASE");
      const reopened = await createStepInstance(tx, step.iniciativaId, bcDef, step.iniciativa.requesterId, now);
      await audit(
        tx,
        step.iniciativaId,
        null,
        "STEP_REABERTA",
        `Gate 1 retornou decisão ${decision}. Etapa "${bcDef.label}" reaberta para o solicitante.`
      );

      const admins = await getAdmins(tx);
      const requester = await tx.user.findUnique({ where: { id: step.iniciativa.requesterId } });
      const recipients = new Set<string>();
      if (requester?.email) recipients.add(requester.email);
      for (const a of admins) recipients.add(a.email);

      return {
        kind: "gate_rejected" as const,
        gateEmail: {
          code: step.iniciativa.code,
          productName: step.iniciativa.productName,
          decision,
          decisionNote: decisionNote ?? "",
          iniciativaId: step.iniciativaId,
          stepInstanceId: reopened.id,
          recipients: Array.from(recipients),
        },
      };
    }

    // ---- Off-sequence step (e.g. Amostras): no chain advance ----
    if (step.stepDefinition.order === null) {
      return { kind: "no_advance" as const };
    }

    // ---- Parallel-group gating ----
    if (step.stepDefinition.parallelGroup) {
      const siblings = await tx.stepInstance.findMany({
        where: {
          iniciativaId: step.iniciativaId,
          stepDefinition: { parallelGroup: step.stepDefinition.parallelGroup },
        },
      });
      const allDone = siblings.every((s) => s.status === "CONCLUIDA" || s.id === stepInstanceId);
      if (!allDone) return { kind: "no_advance" as const }; // this branch advanced, others still pending
    }

    // ---- Advance to next step(s) ----
    const nextDefs = await nextStepDefinitions(tx, step.stepDefinition.order);

    if (nextDefs.length === 0) {
      await tx.iniciativa.update({
        where: { id: step.iniciativaId },
        data: { status: "CONCLUIDA", closedAt: now },
      });
      await audit(tx, step.iniciativaId, null, "INICIATIVA_CONCLUIDA", "Todas as etapas do fluxo foram concluídas.");
      return { kind: "no_advance" as const };
    }

    const newInstances: (StepInstance & { assignee: User | null })[] = [];
    for (const def of nextDefs) {
      const inst = await createStepInstance(tx, step.iniciativaId, def, step.iniciativa.requesterId, now);
      newInstances.push(inst);
      await audit(
        tx,
        step.iniciativaId,
        null,
        "STEP_INICIADA",
        `Etapa "${def.label}" iniciada, responsável: ${inst.assignee?.name ?? "sem responsável definido"}.`
      );
    }

    const pendingEmails = await buildTransicaoEmails(tx, {
      iniciativaId: step.iniciativaId,
      code: step.iniciativa.code,
      productName: step.iniciativa.productName,
      stepAnteriorLabel: step.stepDefinition.label,
      newInstances,
      requesterId: step.iniciativa.requesterId,
    });

    return { kind: "advanced" as const, pendingEmails };
  });

  if (result.kind === "gate_rejected") {
    const { subject, html } = gateRejectedTemplate(result.gateEmail);
    await sendEmail({
      to: result.gateEmail.recipients,
      subject,
      html,
      iniciativaId: result.gateEmail.iniciativaId,
      stepInstanceId: result.gateEmail.stepInstanceId,
      type: "TRANSICAO",
    });
  } else if (result.kind === "advanced") {
    await sendTransicaoEmails(result.pendingEmails);
  }
}

/** Creates the off-sequence "Solicitar Cadastro de Amostras" step instance. */
export async function requestAmostras(params: { iniciativaId: string; userId: string }): Promise<StepInstance> {
  const { iniciativaId, userId } = params;

  return prisma.$transaction(async (tx) => {
    const iniciativa = await tx.iniciativa.findUnique({ where: { id: iniciativaId } });
    if (!iniciativa) throw new Error("Iniciativa não encontrada.");
    if (iniciativa.status !== "ABERTA") throw new Error("A iniciativa não está aberta.");

    const existing = await tx.stepInstance.findFirst({
      where: { iniciativaId, stepDefinition: { key: AMOSTRAS_STEP_KEY } },
    });
    if (existing) throw new Error("Cadastro de amostras já foi solicitado para esta iniciativa.");

    const def = await stepDefByKey(tx, AMOSTRAS_STEP_KEY);
    const inst = await createStepInstance(tx, iniciativaId, def, iniciativa.requesterId);
    await audit(tx, iniciativaId, userId, "AMOSTRAS_SOLICITADA", `Solicitação de Cadastro de Amostras (F.CT-0002) aberta.`);
    return inst;
  });
}

/** Reassigns a step to a different user (must belong to the step's area). */
export async function reassignStep(params: { stepInstanceId: string; newUserId: string; actingUserId: string }) {
  const { stepInstanceId, newUserId, actingUserId } = params;

  await prisma.$transaction(async (tx) => {
    const step = await tx.stepInstance.findUnique({
      where: { id: stepInstanceId },
      include: { stepDefinition: true },
    });
    if (!step) throw new Error("Etapa não encontrada.");
    if (step.status === "CONCLUIDA") throw new Error("Não é possível reatribuir uma etapa já concluída.");

    const belongsToArea = await tx.userArea.findFirst({
      where: { userId: newUserId, areaId: step.stepDefinition.area },
    });
    if (!belongsToArea) throw new Error("O usuário selecionado não pertence à área responsável por esta etapa.");

    const newUser = await tx.user.findUnique({ where: { id: newUserId } });

    await tx.stepInstance.update({ where: { id: stepInstanceId }, data: { assignedUserId: newUserId } });
    await audit(
      tx,
      step.iniciativaId,
      actingUserId,
      "STEP_REATRIBUIDA",
      `Etapa "${step.stepDefinition.label}" reatribuída para ${newUser?.name ?? newUserId}.`
    );
  });
}

/** "Situação do prazo" badge logic reused across list & dashboard. */
export type PrazoSituacao = "NO_PRAZO" | "ATENCAO" | "VENCIDA";

/** Pure/sync version — pass pre-loaded holidays to avoid N+1 queries in list views. */
export function computePrazoSituacaoSync(
  step: { startedAt: Date; dueAt: Date | null },
  holidays: { date: Date }[],
  now: Date = new Date()
): PrazoSituacao {
  if (step.dueAt && now.getTime() > step.dueAt.getTime()) return "VENCIDA";
  const diasUteis = businessDaysBetween(step.startedAt, now, holidays);
  if (diasUteis >= 4) return "ATENCAO";
  return "NO_PRAZO";
}

export async function computePrazoSituacao(step: { startedAt: Date; dueAt: Date | null }): Promise<PrazoSituacao> {
  const holidays = await getHolidays();
  return computePrazoSituacaoSync(step, holidays);
}

export { getHolidays };
