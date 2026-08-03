"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui";
import { DAY_BLOCKS } from "@/lib/availability";
import { saveAvailabilityAction } from "@/lib/actions/availability";

type CellState = "available" | "booked" | "unavailable";

export function AvailabilityGrid({
  days,
  initialGrid,
}: {
  days: { key: number; label: string; date: string }[];
  initialGrid: Record<string, CellState>;
}) {
  const [grid, setGrid] = useState(initialGrid);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle(key: string) {
    setSaved(false);
    setGrid((g) => {
      const current = g[key];
      if (current === "booked") return g;
      return {
        ...g,
        [key]: current === "available" ? "unavailable" : "available",
      };
    });
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    const desired = Object.entries(grid)
      .filter(([, v]) => v === "available")
      .map(([k]) => k);
    try {
      await saveAvailabilityAction(desired);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save availability.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted font-normal pb-2 w-20" />
              {days.map((d) => (
                <th key={d.key} className="text-xs text-muted font-normal pb-2">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_BLOCKS.map((block) => (
              <tr key={block.key}>
                <td className="text-sm text-ink-soft font-medium py-1 pr-3">
                  {block.label}
                </td>
                {days.map((d) => {
                  const key = `${d.key}-${block.key}`;
                  const state = grid[key] ?? "unavailable";
                  return (
                    <td key={key} className="py-1 px-1">
                      <button
                        type="button"
                        disabled={state === "booked"}
                        onClick={() => toggle(key)}
                        className={cn(
                          "w-full h-9 rounded-md text-xs font-medium transition-colors",
                          state === "available" &&
                            "bg-success-tint text-success border border-success/30",
                          state === "booked" &&
                            "bg-danger-tint text-danger cursor-not-allowed",
                          state === "unavailable" &&
                            "bg-black/[0.03] text-muted border border-transparent hover:border-border-soft"
                        )}
                      >
                        {state === "available"
                          ? "Available"
                          : state === "booked"
                          ? "Booked"
                          : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-success-tint border border-success/30" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-black/[0.03]" />
          Unavailable
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-danger-tint" />
          Booked (locked)
        </span>
      </div>
      <p className="text-xs text-muted">
        Booked slots are locked automatically so you&apos;re never shown as
        available for overlapping shifts.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={handleSave} disabled={pending} className="w-fit">
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save availability"}
      </Button>
    </div>
  );
}
