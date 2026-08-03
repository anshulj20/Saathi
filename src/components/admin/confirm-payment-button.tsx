"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmPaymentAction } from "@/lib/actions/admin";

export function ConfirmPaymentButton({
  paymentReferenceId,
}: {
  paymentReferenceId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await confirmPaymentAction(paymentReferenceId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm payment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={pending}>
        {pending ? "Confirming…" : "Mark confirmed"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
