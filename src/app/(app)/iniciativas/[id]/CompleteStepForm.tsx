"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { completeStepAction, type ActionState } from "@/lib/actions/iniciativas";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? "Salvando..." : label}
    </button>
  );
}

export default function CompleteStepForm({ stepInstanceId, isGate }: { stepInstanceId: string; isGate: boolean }) {
  const [state, formAction] = useFormState(completeStepAction, initialState);
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"GO" | "HOLD" | "NO_GO">("GO");

  if (state.success) {
    return <p className="text-xs text-emerald-700 font-medium">Etapa concluída.</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs px-3 py-1.5">
        {isGate ? "Registrar decisão do Gate" : "Concluir etapa"}
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-3 bg-slate-50 border border-slate-200 rounded-md p-3">
      <input type="hidden" name="stepInstanceId" value={stepInstanceId} />
      {state.error && <div className="text-xs text-red-600">{state.error}</div>}

      {isGate && (
        <div>
          <label className="label text-xs">Decisão do Gate</label>
          <div className="flex gap-3">
            {(["GO", "HOLD", "NO_GO"] as const).map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="decision"
                  value={d}
                  checked={decision === d}
                  onChange={() => setDecision(d)}
                />
                {d === "NO_GO" ? "NO-GO" : d}
              </label>
            ))}
          </div>
        </div>
      )}

      {isGate && decision !== "GO" && (
        <div>
          <label className="label text-xs">
            Observação (obrigatória para HOLD / NO-GO)
          </label>
          <textarea name="decisionNote" required rows={2} className="input text-xs" />
        </div>
      )}

      <div>
        <label className="label text-xs">Comentário (opcional)</label>
        <textarea name="comment" rows={2} className="input text-xs" />
      </div>

      <div className="flex gap-2">
        <SubmitButton label={isGate ? "Confirmar decisão" : "Concluir etapa"} />
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs px-3 py-1.5">
          Cancelar
        </button>
      </div>
    </form>
  );
}
