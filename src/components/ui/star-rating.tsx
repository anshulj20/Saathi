import { cn } from "@/lib/ui";

export function StarRatingDisplay({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("text-sm text-primary", className)}>
      ★ {value.toFixed(1)}
      {typeof count === "number" && (
        <span className="text-muted"> ({count} reviews)</span>
      )}
    </span>
  );
}

export function StarRatingInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className={cn(
            "text-3xl leading-none transition-colors",
            star <= value ? "text-primary" : "text-border-soft"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
