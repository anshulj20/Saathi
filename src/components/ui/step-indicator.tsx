import { cn } from "@/lib/ui";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 1-indexed
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {steps.map((label, i) => {
        const step = i + 1;
        const state =
          step < current ? "done" : step === current ? "active" : "todo";
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <span className="w-6 h-px bg-border-soft" />}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
                  state === "done" && "bg-primary-tint text-primary-darker",
                  state === "active" && "bg-primary text-white",
                  state === "todo" &&
                    "border border-border-soft text-muted"
                )}
              >
                {state === "done" ? "✓" : step}
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  state === "todo" ? "text-muted" : "text-ink font-medium"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
