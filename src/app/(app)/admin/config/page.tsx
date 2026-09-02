import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS } from "@/lib/areas";
import SlaField from "./SlaField";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const stepsRaw = await prisma.stepDefinition.findMany();
  const steps = stepsRaw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Configuração de etapas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajuste o prazo (SLA) em dias úteis de cada etapa do fluxo de INP.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Gate</th>
              <th className="px-4 py-3">Grupo paralelo</th>
              <th className="px-4 py-3">SLA (dias úteis)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-slate-400">{s.order ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.phase ? `Fase ${s.phase}` : "—"}</td>
                <td className="px-4 py-3 text-slate-800">{s.label}</td>
                <td className="px-4 py-3 text-slate-600">{AREA_LABELS[s.area]}</td>
                <td className="px-4 py-3 text-slate-600">{s.isGate ? "Sim" : "Não"}</td>
                <td className="px-4 py-3 text-slate-500">{s.parallelGroup ?? "—"}</td>
                <td className="px-4 py-3">
                  <SlaField id={s.id} value={s.slaBusinessDays} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
