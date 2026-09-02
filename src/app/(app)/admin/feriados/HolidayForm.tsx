"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createHolidayAction, type ActionState } from "@/lib/actions/admin";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Salvando..." : "Adicionar feriado"}
    </button>
  );
}

export default function HolidayForm() {
  const [state, formAction] = useFormState(createHolidayAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex items-end gap-3 flex-wrap"
    >
      {state.error && <div className="text-sm text-red-600 basis-full">{state.error}</div>}
      <div>
        <label className="label">Data</label>
        <input name="date" type="date" required className="input" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="label">Descrição</label>
        <input name="description" required placeholder="Ex.: Dia da Independência" className="input" />
      </div>
      <SubmitButton />
    </form>
  );
}
