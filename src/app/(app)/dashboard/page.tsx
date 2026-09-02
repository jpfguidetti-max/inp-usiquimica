import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computePrazoSituacaoSync } from "@/lib/workflow";
import { AREA_LABELS } from "@/lib/areas";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";

export const dynamic = "force-dynamic";

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const [iniciativas, holidays] = await Promise.all([
    prisma.iniciativa.findMany({
      include: {
        requester: true,
        stepInstances: { include: { stepDefinition: true, assignee: true } },
      },
    }),
    prisma.holiday.findMany(),
  ]);

  const now = new Date();
  const total = iniciativas.length;
  const abertas = iniciativas.filter((i) => i.status === "ABERTA");
  const concluidas = iniciativas.filter((i) => i.status === "CONCLUIDA").length;

  type Situ = "NO_PRAZO" | "ATENCAO" | "VENCIDA";
  const abertasComSituacao = abertas.map((ini) => {
    const openSteps = ini.stepInstances.filter((s) => s.status === "EM_ANDAMENTO" && s.stepDefinition.order !== null);
    const currentStep = openSteps[0];
    const situacao: Situ | null = currentStep
      ? computePrazoSituacaoSync(currentStep, holidays, now)
      : null;
    return { ini, currentStep, situacao };
  });

  const noPrazo = abertasComSituacao.filter((x) => x.situacao === "NO_PRAZO").length;
  const atencao = abertasComSituacao.filter((x) => x.situacao === "ATENCAO").length;
  const vencida = abertasComSituacao.filter((x) => x.situacao === "VENCIDA").length;
  const pctNoPrazo = abertas.length > 0 ? Math.round(((noPrazo + atencao) / abertas.length) * 100) : 0;

  // Abertas por fase
  const porFase = [1, 2, 3].map((fase) => ({
    label: `Fase ${fase}`,
    value: abertasComSituacao.filter((x) => x.currentStep?.stepDefinition.phase === fase).length,
  }));

  // Top 5 solicitantes
  const bySolicitante = new Map<string, number>();
  for (const ini of iniciativas) {
    bySolicitante.set(ini.requester.name, (bySolicitante.get(ini.requester.name) ?? 0) + 1);
  }
  const topSolicitantes = Array.from(bySolicitante.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  // Top 5 responsáveis atuais (quem está travando)
  const byResponsavel = new Map<string, number>();
  for (const { currentStep } of abertasComSituacao) {
    if (!currentStep) continue;
    const name = currentStep.assignee?.name ?? "Sem responsável";
    byResponsavel.set(name, (byResponsavel.get(name) ?? 0) + 1);
  }
  const topResponsaveis = Array.from(byResponsavel.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard gerencial</h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral do processo de Introdução de Novo Produto.</p>
        </div>
        <a href="/api/dashboard/export" className="btn-secondary">
          Exportar CSV
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de iniciativas" value={total} />
        <KpiCard label="Abertas" value={abertas.length} />
        <KpiCard label="Concluídas" value={concluidas} />
        <KpiCard
          label="% no prazo (abertas)"
          value={`${pctNoPrazo}%`}
          sub={`${vencida} vencida(s) de ${abertas.length}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Iniciativas abertas por fase</h2>
          <BarChart data={porFase} />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Situação do prazo (abertas)</h2>
          <DonutChart
            data={[
              { label: "No prazo", value: noPrazo, color: "#10b981" },
              { label: "Atenção", value: atencao, color: "#f59e0b" },
              { label: "Vencida", value: vencida, color: "#dc2626" },
            ]}
          />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Top 5 solicitantes</h2>
          <BarChart data={topSolicitantes} horizontal />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Top 5 responsáveis atuais</h2>
          <p className="text-xs text-slate-400 mb-3">Quem tem mais etapas pendentes agora.</p>
          <BarChart data={topResponsaveis} horizontal />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Iniciativas vencidas — atenção</h2>
          <ul className="divide-y divide-slate-100">
            {abertasComSituacao
              .filter((x) => x.situacao === "VENCIDA")
              .slice(0, 8)
              .map(({ ini, currentStep }) => (
                <li key={ini.id} className="py-2 text-sm flex items-center justify-between">
                  <Link href={`/iniciativas/${ini.id}`} className="text-brand-700 hover:underline">
                    {ini.code} — {ini.productName}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {currentStep ? AREA_LABELS[currentStep.stepDefinition.area] : ""}
                  </span>
                </li>
              ))}
            {vencida === 0 && <li className="py-2 text-sm text-slate-400">Nenhuma iniciativa vencida.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
