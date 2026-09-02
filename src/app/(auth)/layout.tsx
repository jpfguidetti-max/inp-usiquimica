export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-600 text-white text-2xl font-bold mb-3">
            U
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Usiquimica</h1>
          <p className="text-sm text-slate-500">Introdução de Novo Produto (INP)</p>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  );
}
