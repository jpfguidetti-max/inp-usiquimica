import NovaIniciativaForm from "./NovaIniciativaForm";

export const dynamic = "force-dynamic";

export default function NovaIniciativaPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Nova Iniciativa</h1>
        <p className="text-sm text-slate-500 mt-1">
          Preencha o Business Case (F.VEN-0015, Fase 1). Ao salvar, a iniciativa é criada e a etapa 1 é
          concluída automaticamente — as etapas de Qualidade e Fábrica são abertas em seguida.
        </p>
      </div>
      <div className="card p-6">
        <NovaIniciativaForm />
      </div>
    </div>
  );
}
