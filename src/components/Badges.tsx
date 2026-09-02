import clsx from "clsx";
import type { PrazoSituacao } from "@/lib/workflow";

export function PrazoBadge({ situacao }: { situacao: PrazoSituacao }) {
  const map: Record<PrazoSituacao, { label: string; cls: string }> = {
    NO_PRAZO: { label: "No prazo", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    ATENCAO: { label: "Atenção", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    VENCIDA: { label: "Vencida", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  };
  const { label, cls } = map[situacao];
  return <span className={clsx("badge", cls)}>{label}</span>;
}

export function StatusGeralBadge({ status }: { status: "ABERTA" | "CONCLUIDA" | "CANCELADA" }) {
  const map = {
    ABERTA: { label: "Aberta", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
    CONCLUIDA: { label: "Concluída", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    CANCELADA: { label: "Cancelada", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  } as const;
  const { label, cls } = map[status];
  return <span className={clsx("badge", cls)}>{label}</span>;
}

export function StepStatusBadge({ status }: { status: "EM_ANDAMENTO" | "CONCLUIDA" | "PENDENTE" }) {
  const map = {
    PENDENTE: { label: "Pendente", cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
    EM_ANDAMENTO: { label: "Em andamento", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
    CONCLUIDA: { label: "Concluída", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  } as const;
  const { label, cls } = map[status];
  return <span className={clsx("badge", cls)}>{label}</span>;
}

export function AreaPill({ label }: { label: string }) {
  return (
    <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200 font-normal">{label}</span>
  );
}
