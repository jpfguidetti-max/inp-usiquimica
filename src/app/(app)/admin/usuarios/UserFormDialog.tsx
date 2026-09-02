"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Area, User, UserArea } from "@prisma/client";
import { AREA_LABELS } from "@/lib/areas";
import { createUserAction, updateUserAction, type ActionState } from "@/lib/actions/admin";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Salvando..." : label}
    </button>
  );
}

export default function UserFormDialog({
  mode,
  areas,
  user,
}: {
  mode: "create" | "edit";
  areas: Area[];
  user?: User & { areas: UserArea[] };
}) {
  const action = mode === "create" ? createUserAction : updateUserAction;
  const [state, formAction] = useFormState(action, initialState);
  const [open, setOpen] = useState(false);

  const currentSelections = new Set((user?.areas ?? []).map((a) => `${a.areaId}:${a.isBackup ? "backup" : "titular"}`));

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === "create" ? "btn-primary" : "text-xs text-brand-700 hover:underline"}>
        {mode === "create" ? "+ Novo usuário" : "Editar"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                {mode === "create" ? "Novo usuário" : `Editar ${user?.name}`}
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form action={formAction} className="p-6 space-y-4">
              {mode === "edit" && <input type="hidden" name="userId" value={user?.id} />}
              {state.error && (
                <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                  {state.error}
                </div>
              )}
              {mode === "create" && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                  O novo usuário será criado com a senha temporária <strong>UBL2026!</strong> e deverá
                  trocá-la no primeiro login.
                </p>
              )}
              <div>
                <label className="label">Nome</label>
                <input name="name" defaultValue={user?.name} required className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" defaultValue={user?.email} required className="input" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isAdmin" defaultChecked={user?.isAdmin} />
                  Administrador (acesso total ao sistema)
                </label>
              </div>
              <div>
                <label className="label">Áreas de responsabilidade</label>
                <div className="space-y-2 border border-slate-200 rounded-md p-3">
                  {areas.map((area) => (
                    <div key={area} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{AREA_LABELS[area]}</span>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            name="areas"
                            value={`${area}:titular`}
                            defaultChecked={currentSelections.has(`${area}:titular`)}
                          />
                          Titular
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            name="areas"
                            value={`${area}:backup`}
                            defaultChecked={currentSelections.has(`${area}:backup`)}
                          />
                          Backup
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Um usuário pode ter mais de uma área. Somente um titular por área é usado como responsável
                  padrão ao abrir uma nova etapa.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <SubmitButton label={mode === "create" ? "Criar usuário" : "Salvar alterações"} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
