"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadAttachmentAction, type ActionState } from "@/lib/actions/iniciativas";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-xs px-3 py-1.5">
      {pending ? "Enviando..." : "Anexar arquivo"}
    </button>
  );
}

export default function AttachmentForm({
  iniciativaId,
  stepInstanceId,
}: {
  iniciativaId: string;
  stepInstanceId?: string;
}) {
  const [state, formAction] = useFormState(uploadAttachmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2 flex-wrap"
    >
      <input type="hidden" name="iniciativaId" value={iniciativaId} />
      {stepInstanceId && <input type="hidden" name="stepInstanceId" value={stepInstanceId} />}
      <input type="file" name="file" required className="text-xs" />
      <SubmitButton />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
