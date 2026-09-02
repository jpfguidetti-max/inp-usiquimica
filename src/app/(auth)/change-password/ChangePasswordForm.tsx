"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/auth";

const initialState: ChangePasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Salvando..." : "Salvar nova senha"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    if (state.success) {
      (async () => {
        await update({ mustChangePassword: false });
        router.push("/dashboard");
        router.refresh();
      })();
    }
  }, [state.success, update, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="currentPassword">
          Senha atual
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          Nova senha (mínimo 8 caracteres)
        </label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirmar nova senha
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="input" />
      </div>
      <SubmitButton />
    </form>
  );
}
