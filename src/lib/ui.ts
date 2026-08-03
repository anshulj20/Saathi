export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  md: "px-6 py-3 text-[15px]",
  sm: "px-4 py-2 text-sm",
};

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary:
    "border border-border-soft text-ink bg-transparent hover:bg-black/[0.03]",
  outline: "border border-primary text-primary-dark hover:bg-primary-tint",
  ghost: "text-primary-dark hover:bg-primary-tint",
  danger: "bg-danger text-white shadow-[0_6px_20px_0_rgba(190,50,30,0.35)]",
};

export function buttonClasses(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  className?: string
) {
  return cn(base, sizes[size], variants[variant], className);
}
