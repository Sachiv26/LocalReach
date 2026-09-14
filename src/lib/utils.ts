import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const CURRENCY_SYMBOLS: Record<string, string> = { ZAR: "R" };

export function formatPrice(
  amount: number | string | null | undefined,
  currency = "ZAR"
): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "";
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const formatted = n.toLocaleString("en-ZA", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(d);
}

export function generateSlug(title: string): string {
  const base = slugify(title);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "ad"}-${suffix}`;
}

export function waMeLink(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const international = digits.startsWith("0")
    ? `27${digits.slice(1)}`
    : digits;
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${international}${params}`;
}

export function telLink(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}

export function whatsappShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  return {
    items,
    page,
    pageSize,
    hasNext: items.length === pageSize,
  };
}

export function parsePage(searchParams: Record<string, string | undefined>) {
  const page = Number(searchParams.page ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export const DEFAULT_PAGE_SIZE = 20;

export function formatRelativeDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.toLocaleDateString("en-ZA", { weekday: "long" });
  const diff = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Today"; if (diff === 1) return "Tomorrow"; if (diff === -1) return "Yesterday"; if (diff > 0 && diff < 7) return day;
  return formatDate(d);
}
export function communityTimezoneDate(date: Date | string, tz = "Africa/Johannesburg"): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const iso = d.toLocaleString("en-ZA", { timeZone: tz });
  return new Date(iso);
}

export function formatCurrency(amount: number | string | null | undefined, currency = "ZAR"): string {
  return formatPrice(amount, currency);
}
