"use client";

import { useState, useTransition } from "react";
import { toggleUserActiveAction, resetPasswordAction } from "@/lib/actions/admin";

export default function UserRowActions({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleUserActiveAction(userId, !active);
          })
        }
        className="text-xs text-slate-600 hover:underline"
      >
        {active ? "Desativar" : "Reativar"}
      </button>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await resetPasswordAction(userId);
            setMessage(res.error ?? "Senha redefinida para UBL2026!");
          })
        }
        className="text-xs text-slate-600 hover:underline"
      >
        Redefinir senha
      </button>
      {message && <span className="text-xs text-emerald-700">{message}</span>}
    </div>
  );
}
