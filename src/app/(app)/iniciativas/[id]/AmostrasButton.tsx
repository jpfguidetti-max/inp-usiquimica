"use client";

import { useState, useTransition } from "react";
import { requestAmostrasAction } from "@/lib/actions/iniciativas";

export default function AmostrasButton({ iniciativaId }: { iniciativaId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await requestAmostrasAction(iniciativaId);
            if (res.error) setError(res.error);
          })
        }
      >
        {pending ? "Solicitando..." : "Solicitar Cadastro de Amostras"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
