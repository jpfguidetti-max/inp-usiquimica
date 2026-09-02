import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NavLink } from "@/components/NavLinks";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/iniciativas", label: "Iniciativas" },
];

const ADMIN_ITEMS = [
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/feriados", label: "Feriados" },
  { href: "/admin/config", label: "Configuração de etapas" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              U
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">Usiquimica</div>
              <div className="text-xs text-slate-500 leading-tight">INP</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {session.user.isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Administração
              </div>
              {ADMIN_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-slate-200">
          <Link href="/iniciativas/nova" className="btn-primary w-full">
            + Nova Iniciativa
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800 leading-tight">{session.user.name}</div>
              <div className="text-xs text-slate-500 leading-tight">
                {session.user.isAdmin ? "Administrador" : "Usuário"}
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
