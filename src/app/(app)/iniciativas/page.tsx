import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computePrazoSituacaoSync, type PrazoSituacao } from "@/lib/workflow";
import { AREA_LABELS } from "@/lib/areas";
import { PrazoBadge, StatusGeralBadge } from "@/components/Badges";
import { businessDaysBetween } from "@/lib/businessDays";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  fase?: string;
  area?: string;
  solicitante?: string;
  prazo?: string;
};

export default async function IniciativasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [iniciativas, holidays, requesters] = await Promise.all([
    prisma.iniciativa.findMany({
      include: {
        requester: true,
        stepInstances: {
          include: { stepDefinition: true, assignee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.holiday.findMany(),
    prisma.user.findMany({ where: { iniciativasSolicitadas: { some: {} } }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();

  const rows = iniciativas.map((ini) => {
    const openSteps = ini.stepInstances.filter((s) => s.status === "EM_ANDAMENTO");
    // main-chain open step (exclude the off-sequence amostras step for "etapa atual")
    const currentStep = openSteps.find((s) => s.stepDefinition.order !== null) ?? openSteps[0];
    const situacao: PrazoSituacao | null = currentStep
      ? computePrazoSituacaoSync(currentStep, holidays, now)
      : null;
    const diasNaEtapa = currentStep ? businessDaysBetween(currentStep.startedAt, now, holidays) : null;

    return {
      ini,
      currentStep,
      situacao,
      diasNaEtapa,
    };
  });

  const filtered = rows.filter(({ ini, currentStep, situacao }) => {
    if (searchParams.status && ini.status !== searchParams.status) return false;
    if (searchParams.fase && String(currentStep?.stepDefinition.phase ?? "") !== searchParams.fase) return false;
    if (searchParams.area && currentStep?.stepDefinition.area !== searchParams.area) return false;
    if (searchParams.solicitante && ini.requesterId !== searchParams.solicitante) return false;
    if (searchParams.prazo && situacao !== searchParams.prazo) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Iniciativas</h1>
          <p className="text-sm text-slate-500 mt-1">Área de status de todas as aberturas de INP.</p>
        </div>
        <Link href="/iniciativas/nova" className="btn-primary">
          + Nova Iniciativa
        </Link>
      </div>

      <form className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3" method="get">
        <div>
          <label className="label">Status geral</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="input">
            <option value="">Todos</option>
            <option value="ABERTA">Aberta</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="label">Fase</label>
          <select name="fase" defaultValue={searchParams.fase ?? ""} className="input">
            <option value="">Todas</option>
            <option value="1">Fase 1</option>
            <option value="2">Fase 2</option>
            <option value="3">Fase 3</option>
          </select>
        </div>
        <div>
          <label className="label">Área responsável</label>
          <select name="area" defaultValue={searchParams.area ?? ""} className="input">
            <option value="">Todas</option>
            {Object.entries(AREA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Solicitante</label>
          <select name="solicitante" defaultValue={searchParams.solicitante ?? ""} className="input">
            <option value="">Todos</option>
            {requesters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Situação do prazo</label>
          <select name="prazo" defaultValue={searchParams.prazo ?? ""} className="input">
            <option value="">Todas</option>
            <option value="NO_PRAZO">No prazo</option>
            <option value="ATENCAO">Atenção</option>
            <option value="VENCIDA">Vencida</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-5 flex gap-2">
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          <Link href="/iniciativas" className="btn-secondary">
            Limpar
          </Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Etapa atual</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Abertura</th>
              <th className="px-4 py-3">Dias na etapa</th>
              <th className="px-4 py-3">Prazo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(({ ini, currentStep, situacao, diasNaEtapa }) => (
              <tr key={ini.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-medium text-brand-700">
                  <Link href={`/iniciativas/${ini.id}`} className="hover:underline">
                    {ini.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-800">{ini.productName}</td>
                <td className="px-4 py-3 text-slate-600">{ini.requester.name}</td>
                <td className="px-4 py-3">
                  <StatusGeralBadge status={ini.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {currentStep?.stepDefinition.phase ? `Fase ${currentStep.stepDefinition.phase}` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{currentStep?.stepDefinition.label ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {currentStep?.assignee?.name ?? (currentStep ? "sem responsável definido" : "—")}
                </td>
                <td className="px-4 py-3 text-slate-500">{ini.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-slate-500">{diasNaEtapa ?? "—"}</td>
                <td className="px-4 py-3">{situacao ? <PrazoBadge situacao={situacao} /> : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma iniciativa encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
