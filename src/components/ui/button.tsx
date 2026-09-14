import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "whatsapp";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm",
  secondary:
    "bg-brand-100 text-brand-800 hover:bg-brand-200 focus-visible:outline-brand-600",
  outline:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:outline-brand-600",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:outline-brand-600",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-sm",
  whatsapp:
    "bg-[#25D366] text-white hover:bg-[#1eb957] focus-visible:outline-[#25D366] shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-2",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
