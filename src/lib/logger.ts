/**
 * Structured logger. Emits JSON lines so that log drains (Vercel, Datadog, Sentry breadcrumbs)
 * can parse them. External services are optional — never required for local development.
 */

type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown>;

function emit(level: Level, message: string, fields?: Fields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(fields ? { fields } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Fields) => {
    if (process.env.NODE_ENV === "development") emit("debug", message, fields);
  },
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, fields?: Fields) => emit("error", message, fields),
};
