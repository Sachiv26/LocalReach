"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: Listener[] = [];
let counter = 0;

function emit() {
  for (const l of listeners) l([...toasts]);
}

export function toast(
  message: string,
  tone: "success" | "error" | "info" = "success"
) {
  const id = ++counter;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4500);
}

/** Accessible toast notifications (aria-live). */
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm shadow-lg animate-slide-up ${
            t.tone === "success"
              ? "bg-green-600 text-white"
              : t.tone === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-900 text-white"
          }`}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : t.tone === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
