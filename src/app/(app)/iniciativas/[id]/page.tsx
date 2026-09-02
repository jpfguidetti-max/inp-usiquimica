import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PHASE_COLORS } from "@/lib/areas";
import { StatusGeralBadge } from "@/components/Badges";
import { AMOSTRAS_STEP_KEY } from "@/lib/stepDefinitions";
import StepCard from "./StepCard";
import AmostrasButton from "./AmostrasButton";
import AttachmentForm from "./AttachmentForm";

export const dynamic = "force-dynamic";

export default async function IniciativaDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const iniciativa = await prisma.iniciativa.findUnique({
    where: { id: params.id },
    include: {
      requester: true,
      stepInstances: {
        include: {
          stepDefinition: true,
          assignee: true,
          completedBy: true,
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
          attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { startedAt: "asc" },
      },
      attachments: { include: { uploadedBy: true }, where: { stepInstanceId: null }, orderBy: { createdAt: "desc" } },
      auditLogs: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!iniciativa) notFound();

  const holidays = await prisma.holiday.findMany();
  const allAreaUsers = await prisma.userArea.findMany({ include: { user: true } });
  const allStepDefs = await prisma.stepDefinition.findMany({
    where: { order: { not: null } },
    orderBy: { order: "asc" },
  });

  const mainSteps = iniciativa.stepInstances.filter((s) => s.stepDefinition.key !== AMOSTRAS_STEP_KEY);
  const amostrasSteps = iniciativa.stepInstances.filter((s) => s.stepDefinition.key === AMOSTRAS_STEP_KEY);

  // Group main steps by their StepDefinition order (chronological instances per order —
  // normally 1, but F1_BUSINESS_CASE can repeat if Gate 1 returns HOLD/NO-GO).
  const byOrder = new Map<number, typeof mainSteps>();
  for (const s of mainSteps) {
    const order = s.stepDefinition.order ?? -1;
    if (!byOrder.has(order)) byOrder.set(order, []);
    byOrder.get(order)!.push(s);
  }
  // Every step of the 19-step chain is rendered, even if not started yet
  // ("pendente" placeholder), so the whole workflow is always fully visible.

  const canRequestAmostras =
    iniciativa.status === "ABERTA" && amostrasSteps.length === 0;

  const currentUserId = session?.user?.id ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">{iniciativa.code}</h1>
              <StatusGeralBadge status={iniciativa.status} />
            </div>
            <p className="text-slate-600 mt-1">{iniciativa.productName}</p>
          </div>
          {canRequestAmostras && <AmostrasButton iniciativaId={iniciativa.id} />}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-sm">
          <div>
            <dt className="text-slate-400">Solicitante</dt>
            <dd className="text-slate-800 font-medium">{iniciativa.requester.name}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Data de abertura</dt>
            <dd className="text-slate-800 font-medium">{iniciativa.createdAt.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Data de conclusão</dt>
            <dd className="text-slate-800 font-medium">
              {iniciativa.closedAt ? iniciativa.closedAt.toLocaleDateString("pt-BR") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Anexos gerais</dt>
            <dd className="text-slate-800 font-medium">{iniciativa.attachments.length}</dd>
          </div>
        </dl>
      </div>

      {/* Workflow visualization */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">Fluxo do INP</h2>
        <div className="space-y-3">
          {allStepDefs.map((def, idx) => {
            const instances = byOrder.get(def.order as number) ?? [];
            const phase = def.phase;
            const showPhaseHeader = idx === 0 || allStepDefs[idx - 1].phase !== phase;
            return (
              <div key={def.id}>
                {showPhaseHeader && phase && (
                  <div className={`text-xs font-semibold uppercase tracking-wide mt-6 mb-2 ${PHASE_COLORS[phase].text}`}>
                    {PHASE_COLORS[phase].label}
                  </div>
                )}
                <div className="space-y-3">
                  {instances.length > 0 ? (
                    instances.map((instance) => (
                      <StepCard
                        key={instance.id}
                        instance={instance}
                        holidays={holidays}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        areaUsers={allAreaUsers.filter((au) => au.areaId === instance.stepDefinition.area)}
                        iniciativaId={iniciativa.id}
                      />
                    ))
                  ) : (
                    <StepCard
                      key={def.id}
                      instance={null}
                      stepDefinition={def}
                      holidays={holidays}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      areaUsers={[]}
                      iniciativaId={iniciativa.id}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Amostras branch */}
      {amostrasSteps.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
            Cadastro de Amostras (F.CT-0002)
          </h2>
          <div className="space-y-3">
            {amostrasSteps.map((instance) => (
              <StepCard
                key={instance.id}
                instance={instance}
                holidays={holidays}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                areaUsers={allAreaUsers.filter((au) => au.areaId === instance.stepDefinition.area)}
                iniciativaId={iniciativa.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* General attachments */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
          Anexos gerais da iniciativa
        </h2>
        <ul className="space-y-2 mb-4">
          {iniciativa.attachments.map((a) => (
            <li key={a.id} className="text-sm flex items-center justify-between border-b border-slate-100 pb-2">
              <a href={a.blobUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                {a.fileName}
              </a>
              <span className="text-slate-400 text-xs">
                {a.uploadedBy.name} · {a.createdAt.toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
          {iniciativa.attachments.length === 0 && (
            <li className="text-sm text-slate-400">Nenhum anexo geral enviado ainda.</li>
          )}
        </ul>
        <AttachmentForm iniciativaId={iniciativa.id} />
      </div>

      {/* Audit log */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
          Histórico / Auditoria
        </h2>
        <ol className="space-y-3">
          {iniciativa.auditLogs.map((log) => (
            <li key={log.id} className="text-sm flex gap-3">
              <span className="text-slate-400 shrink-0 w-36">
                {log.createdAt.toLocaleString("pt-BR")}
              </span>
              <span className="text-slate-700">
                {log.details}
                {log.user && <span className="text-slate-400"> — {log.user.name}</span>}
              </span>
            </li>
          ))}
          {iniciativa.auditLogs.length === 0 && (
            <li className="text-sm text-slate-400">Sem eventos registrados.</li>
          )}
        </ol>
      </div>
    </div>
  );
}
