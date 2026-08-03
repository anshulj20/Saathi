import { buttonClasses } from "@/lib/ui";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props} />
  );
}
