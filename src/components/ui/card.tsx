import { cn } from "@/lib/ui";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-xl p-6",
        className
      )}
      {...props}
    />
  );
}
