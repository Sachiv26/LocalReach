/**
 * Typed application error. Always map to user-friendly messages; never leak stack traces.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "QUOTA_EXCEEDED"
  | "POSTING_HOURS"
  | "RULE_BLOCKED"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  QUOTA_EXCEEDED: 429,
  POSTING_HOURS: 423,
  RULE_BLOCKED: 422,
  CONFLICT: 409,
  PAYMENT_ERROR: 402,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "AppError";
  }

  get status() {
    return STATUS[this.code];
  }
}

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  return "Something went wrong. Please try again.";
}

/** Serialize an error for server action return values. */
export function serializeError(err: unknown) {
  if (err instanceof AppError) {
    return {
      ok: false as const,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }
  console.error(err);
  return {
    ok: false as const,
    code: "INTERNAL" as const,
    message: "Something went wrong. Please try again.",
  };
}
