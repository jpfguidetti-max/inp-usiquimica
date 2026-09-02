"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateStepSlaAction, type ActionState } from "@/lib/actions/admin";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-xs px-2 py-1">
      {pending ? "..." : "Salvar"}
    </button>
  );
}

export default function SlaField({ id, value }: { id: string; value: number }) {
  const [state, formAction] = useFormState(updateStepSlaAction, initialState);
  const [current, setCurrent] = useState(value);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        type="number"
        name="slaBusinessDays"
        min={1}
        value={current}
        onChange={(e) => setCurrent(Number(e.target.value))}
        className="input w-16 text-xs py-1"
      />
      <SubmitButton />
      {state.success && <span className="text-xs text-emerald-700">salvo</span>}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
