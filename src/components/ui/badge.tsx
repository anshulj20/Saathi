import { cn } from "@/lib/ui";

type BadgeTone = "primary" | "success" | "danger" | "neutral";

const tones: Record<BadgeTone, string> = {
  primary: "bg-primary-tint text-primary-darker",
  success: "bg-success-tint text-success",
  danger: "bg-danger-tint text-danger",
  neutral: "bg-black/[0.05] text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="success" className={className}>
      ✓ Verified
    </Badge>
  );
}
