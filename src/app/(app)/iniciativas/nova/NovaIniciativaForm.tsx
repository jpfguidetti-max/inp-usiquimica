"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createIniciativaAction, type ActionState } from "@/lib/actions/iniciativas";
import { FASE1_FIELDS } from "@/lib/formFields";
import DynamicField from "@/components/DynamicField";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Salvando..." : "Criar Iniciativa"}
    </button>
  );
}

export default function NovaIniciativaForm() {
  const [state, formAction] = useFormState(createIniciativaAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="productName">
          Nome do produto <span className="text-red-500">*</span>
        </label>
        <input id="productName" name="productName" type="text" required className="input" />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Business Case (F.VEN-0015 — Fase 1)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FASE1_FIELDS.map((f) => (
            <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <DynamicField field={f} prefix="fase1." />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
