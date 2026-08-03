"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { assignReplacementNurseAction } from "@/lib/actions/admin";

export function AssignReplacementForm({
  bookingId,
  nurses,
}: {
  bookingId: string;
  nurses: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(nurses[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAssign() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      await assignReplacementNurseAction(bookingId, selected);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign nurse.");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
        {nurses.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </Select>
      <Button size="sm" onClick={handleAssign} disabled={pending || !selected}>
        {pending ? "Assigning…" : "Assign"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
