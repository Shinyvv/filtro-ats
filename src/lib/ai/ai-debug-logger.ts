type LogMetadata = Record<string, unknown>;

export function isAiDebugEnabled(): boolean {
  return process.env.AI_DEBUG_LOGS === "true";
}

export function truncateForLog(value: string, maxChars = 500): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}...[truncated:${value.length}]`;
}

export function maskEmail(email: string | undefined): string | undefined {
  if (!email) {
    return undefined;
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[invalid-email]";
  }

  const visibleLocal = localPart.slice(0, 2);
  return `${visibleLocal}***@${domain}`;
}

export function getErrorInfo(error: unknown): {
  name?: string;
  message: string;
  stack?: string;
  cause?: unknown;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isAiDebugEnabled() ? error.stack : undefined,
      cause: "cause" in error ? error.cause : undefined,
    };
  }

  return {
    message: String(error),
  };
}

export function logAiDebug(event: string, metadata: LogMetadata = {}): void {
  if (!isAiDebugEnabled()) {
    return;
  }

  console.info(`[ai:debug] ${event}`, metadata);
}

export function logAiWarn(event: string, metadata: LogMetadata = {}): void {
  console.warn(`[ai:warn] ${event}`, metadata);
}

export function logAiError(
  event: string,
  error: unknown,
  metadata: LogMetadata = {},
): void {
  console.error(`[ai:error] ${event}`, {
    ...metadata,
    error: getErrorInfo(error),
  });
}
