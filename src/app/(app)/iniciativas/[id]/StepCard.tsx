import clsx from "clsx";
import type { Prisma, StepDefinition } from "@prisma/client";
import { AREA_LABELS, PHASE_COLORS } from "@/lib/areas";
import { computePrazoSituacaoSync } from "@/lib/workflow";
import { PrazoBadge, StepStatusBadge, AreaPill } from "@/components/Badges";
import CompleteStepForm from "./CompleteStepForm";
import ReassignForm from "./ReassignForm";
import CommentForm from "./CommentForm";
import AttachmentForm from "./AttachmentForm";

type InstanceWithRelations = Prisma.StepInstanceGetPayload<{
  include: {
    stepDefinition: true;
    assignee: true;
    completedBy: true;
    comments: { include: { user: true } };
    attachments: { include: { uploadedBy: true } };
  };
}>;

export default function StepCard({
  instance,
  stepDefinition,
  holidays,
  currentUserId,
  isAdmin,
  areaUsers,
  iniciativaId,
}: {
  instance: InstanceWithRelations | null;
  stepDefinition?: StepDefinition;
  holidays: { date: Date }[];
  currentUserId: string;
  isAdmin: boolean;
  areaUsers: { userId: string; user: { id: string; name: string } }[];
  iniciativaId: string;
}) {
  const def = instance?.stepDefinition ?? stepDefinition;
  if (!def) return null;

  const phase = def.phase ?? undefined;
  const phaseColor = phase ? PHASE_COLORS[phase] : { border: "border-l-slate-300", bg: "bg-white", text: "text-slate-600" };

  const status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" = !instance
    ? "PENDENTE"
    : instance.status === "CONCLUIDA"
    ? "CONCLUIDA"
    : "EM_ANDAMENTO";

  const situacao =
    instance && instance.status === "EM_ANDAMENTO"
      ? computePrazoSituacaoSync({ startedAt: instance.startedAt, dueAt: instance.dueAt }, holidays)
      : null;

  const canComplete =
    instance &&
    instance.status === "EM_ANDAMENTO" &&
    (isAdmin || instance.assignedUserId === currentUserId);

  const reassignOptions = areaUsers
    .filter((au) => au.userId !== instance?.assignedUserId)
    .map((au) => au.user);
  const canReassign =
    instance && instance.status === "EM_ANDAMENTO" && (isAdmin || instance.assignedUserId === currentUserId);

  return (
    <div
      className={clsx(
        "rounded-lg border border-l-4 p-4",
        phaseColor.border,
        def.isGate ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200",
        status === "PENDENTE" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {def.isGate && (
              <span className="inline-flex items-center justify-center w-5 h-5 rotate-45 bg-amber-500 text-white text-[10px] font-bold shrink-0">
                <span className="-rotate-45">G</span>
              </span>
            )}
            <h3 className="text-sm font-semibold text-slate-800">{def.label}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <AreaPill label={AREA_LABELS[def.area]} />
            <StepStatusBadge status={status} />
            {situacao && <PrazoBadge situacao={situacao} />}
            {instance?.decision && (
              <span
                className={clsx(
                  "badge",
                  instance.decision === "GO" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                  instance.decision === "HOLD" && "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                  instance.decision === "NO_GO" && "bg-red-50 text-red-700 ring-1 ring-red-200"
                )}
              >
                {instance.decision === "NO_GO" ? "NO-GO" : instance.decision}
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 shrink-0">
          {instance ? (
            <>
              <div>
                Responsável:{" "}
                <span className="font-medium text-slate-700">
                  {instance.assignee?.name ?? "sem responsável definido"}
                </span>
              </div>
              {canReassign && (
                <div className="mt-1">
                  <ReassignForm stepInstanceId={instance.id} options={reassignOptions} />
                </div>
              )}
            </>
          ) : (
            <div className="italic">Aguardando etapas anteriores</div>
          )}
        </div>
      </div>

      {instance && (
        <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-slate-500">
          <div>
            <div className="text-slate-400">Iniciada em</div>
            <div className="text-slate-700">{instance.startedAt.toLocaleDateString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-slate-400">Prazo (SLA)</div>
            <div className="text-slate-700">{instance.dueAt?.toLocaleDateString("pt-BR") ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-400">Concluída em</div>
            <div className="text-slate-700">
              {instance.completedAt ? instance.completedAt.toLocaleDateString("pt-BR") : "—"}
              {instance.completedBy && <span className="text-slate-400"> ({instance.completedBy.name})</span>}
            </div>
          </div>
        </div>
      )}

      {instance?.decisionNote && (
        <div className="mt-3 text-xs bg-white/70 border border-amber-200 rounded p-2 text-slate-700">
          <span className="font-medium">Observação da Diretoria: </span>
          {instance.decisionNote}
        </div>
      )}

      {canComplete && (
        <div className="mt-3">
          <CompleteStepForm stepInstanceId={instance.id} isGate={def.isGate} />
        </div>
      )}

      {instance && (
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
          {instance.comments.length > 0 && (
            <ul className="space-y-1.5">
              {instance.comments.map((c) => (
                <li key={c.id} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{c.user.name}:</span> {c.text}
                  <span className="text-slate-400"> · {c.createdAt.toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
          <CommentForm stepInstanceId={instance.id} iniciativaId={iniciativaId} />

          {instance.attachments.length > 0 && (
            <ul className="space-y-1 mt-2">
              {instance.attachments.map((a) => (
                <li key={a.id} className="text-xs">
                  <a href={a.blobUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                    {a.fileName}
                  </a>
                  <span className="text-slate-400"> · {a.uploadedBy.name}</span>
                </li>
              ))}
            </ul>
          )}
          <AttachmentForm iniciativaId={iniciativaId} stepInstanceId={instance.id} />
        </div>
      )}
    </div>
  );
}
