"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addCommentAction, type ActionState } from "@/lib/actions/iniciativas";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary text-xs px-3 py-1.5">
      {pending ? "Enviando..." : "Comentar"}
    </button>
  );
}

export default function CommentForm({
  stepInstanceId,
  iniciativaId,
}: {
  stepInstanceId: string;
  iniciativaId: string;
}) {
  const [state, formAction] = useFormState(addCommentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex items-start gap-2 mt-2"
    >
      <input type="hidden" name="stepInstanceId" value={stepInstanceId} />
      <input type="hidden" name="iniciativaId" value={iniciativaId} />
      <input name="text" placeholder="Escreva um comentário..." className="input text-xs flex-1" />
      <SubmitButton />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
