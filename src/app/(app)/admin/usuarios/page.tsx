import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS, ALL_AREAS } from "@/lib/areas";
import UserFormDialog from "./UserFormDialog";
import UserRowActions from "./UserRowActions";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { areas: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie usuários, áreas de responsabilidade e acesso.</p>
        </div>
        <UserFormDialog mode="create" areas={ALL_AREAS} />
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Áreas</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={!u.active ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-wrap gap-1">
                    {u.areas.map((a) => (
                      <span key={a.id} className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200 font-normal">
                        {AREA_LABELS[a.areaId]}
                        {a.isBackup ? " (backup)" : ""}
                      </span>
                    ))}
                    {u.areas.length === 0 && <span className="text-xs text-slate-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{u.isAdmin ? "Sim" : "Não"}</td>
                <td className="px-4 py-3">{u.active ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <UserFormDialog mode="edit" areas={ALL_AREAS} user={u} />
                    <UserRowActions userId={u.id} active={u.active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
