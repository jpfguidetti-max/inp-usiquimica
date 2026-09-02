import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePrazoSituacaoSync } from "@/lib/workflow";
import { AREA_LABELS } from "@/lib/areas";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [iniciativas, holidays] = await Promise.all([
    prisma.iniciativa.findMany({
      include: {
        requester: true,
        stepInstances: { include: { stepDefinition: true, assignee: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.holiday.findMany(),
  ]);

  const now = new Date();
  const header = [
    "codigo",
    "produto",
    "solicitante",
    "status_geral",
    "fase_atual",
    "etapa_atual",
    "area_responsavel",
    "responsavel_atual",
    "data_abertura",
    "data_conclusao",
    "situacao_prazo",
    "prazo_etapa_atual",
  ];

  const lines = [header.join(",")];

  for (const ini of iniciativas) {
    const currentStep = ini.stepInstances.find(
      (s) => s.status === "EM_ANDAMENTO" && s.stepDefinition.order !== null
    );
    const situacao = currentStep ? computePrazoSituacaoSync(currentStep, holidays, now) : "";

    const row = [
      ini.code,
      ini.productName,
      ini.requester.name,
      ini.status,
      currentStep?.stepDefinition.phase ? `Fase ${currentStep.stepDefinition.phase}` : "",
      currentStep?.stepDefinition.label ?? "",
      currentStep ? AREA_LABELS[currentStep.stepDefinition.area] : "",
      currentStep?.assignee?.name ?? "",
      ini.createdAt.toLocaleDateString("pt-BR"),
      ini.closedAt ? ini.closedAt.toLocaleDateString("pt-BR") : "",
      situacao,
      currentStep?.dueAt ? currentStep.dueAt.toLocaleDateString("pt-BR") : "",
    ].map((v) => csvEscape(String(v)));

    lines.push(row.join(","));
  }

  const csv = "﻿" + lines.join("\n"); // BOM for Excel pt-BR compatibility

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iniciativas_inp_${now.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
