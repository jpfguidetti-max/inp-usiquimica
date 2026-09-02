import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HolidayForm from "./HolidayForm";
import DeleteHolidayButton from "./DeleteHolidayButton";

export const dynamic = "force-dynamic";

export default async function AdminFeriadosPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Feriados</h1>
        <p className="text-sm text-slate-500 mt-1">
          Datas cadastradas aqui são excluídas do cálculo de dias úteis (prazos de SLA).
        </p>
      </div>

      <div className="card p-5 mb-6">
        <HolidayForm />
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holidays.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3 text-slate-800">{h.date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                <td className="px-4 py-3 text-slate-600">{h.description}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteHolidayButton id={h.id} />
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Nenhum feriado cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
