"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { reassignStepAction, type ActionState } from "@/lib/actions/iniciativas";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-xs px-2 py-1">
      {pending ? "..." : "Salvar"}
    </button>
  );
}

export default function ReassignForm({
  stepInstanceId,
  options,
}: {
  stepInstanceId: string;
  options: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(reassignStepAction, initialState);
  const [open, setOpen] = useState(false);

  if (options.length === 0) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-brand-700 hover:underline">
        Reatribuir
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2 mt-1">
      <input type="hidden" name="stepInstanceId" value={stepInstanceId} />
      <select name="newUserId" className="input text-xs py-1" required>
        <option value="">Selecionar...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <SubmitButton />
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
        cancelar
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
