import { cn } from "@/lib/utils";
import type { HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5 pb-0", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-gray-900", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

const fieldBase =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-10 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-gray-700", className)}
      {...props}
    />
  );
}

type BadgeTone =
  | "gray"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "brand"
  | "purple";

const tones: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  brand: "bg-brand-100 text-brand-800",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-gray-400">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "amber" | "green" | "red";
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  } as const;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg p-2", toneClasses[tone])}>{icon}</div>
        ) : null}
      </div>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />
  );
}

export function Pagination({
  currentPage,
  totalPages,
  hrefPrefix,
}: {
  currentPage: number;
  totalPages: number;
  hrefPrefix: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
      <p className="text-sm text-gray-600">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        {currentPage > 1 ? (
          <a
            href={`${hrefPrefix}?page=${currentPage - 1}`}
            className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Prev
          </a>
        ) : null}
        {pages.map((p) =>
          p === currentPage ? (
            <span
              key={p}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white"
            >
              {p}
            </span>
          ) : (
            <a
              key={p}
              href={`${hrefPrefix}?page=${p}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              {p}
            </a>
          )
        )}
        {currentPage < totalPages ? (
          <a
            href={`${hrefPrefix}?page=${currentPage + 1}`}
            className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            Next →
          </a>
        ) : null}
      </div>
    </nav>
  );
}

export function Alert({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "red" | "green" | "blue";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    green: "border-green-200 bg-green-50 text-green-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
  } as const;
  return (
    <div className={cn("rounded-lg border p-3 text-sm", tones[tone])}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
