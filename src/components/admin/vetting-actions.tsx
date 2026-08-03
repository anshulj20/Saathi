"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activateAccountAction, rejectAccountAction } from "@/lib/actions/admin";

export function VettingActions({ userId }: { userId: string }) {
  const [pending, setPending] = useState<"activate" | "reject" | null>(null);
  const router = useRouter();

  async function run(action: "activate" | "reject") {
    setPending(action);
    try {
      if (action === "activate") await activateAccountAction(userId);
      else await rejectAccountAction(userId);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run("activate")} disabled={!!pending}>
        {pending === "activate" ? "Activating…" : "Activate"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => run("reject")}
        disabled={!!pending}
      >
        {pending === "reject" ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}
