"use client";

import { useTransition } from "react";
import { deleteHolidayAction } from "@/lib/actions/admin";

export default function DeleteHolidayButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteHolidayAction(id);
        })
      }
      className="text-xs text-red-600 hover:underline"
    >
      Remover
    </button>
  );
}
