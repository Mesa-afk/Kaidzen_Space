import { z } from "zod";
import { ApiError, validationError, type ErrorDetail } from "./errors";

export const MAX_REQUEST_BYTES = 128 * 1024;
export const MAX_GRAPH_NODES = 100;

export function requestId(request: Request) {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[a-zA-Z0-9._:-]{1,100}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export function idempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key");
  if (value && !/^[a-zA-Z0-9._:-]{1,200}$/.test(value)) {
    throw validationError("Invalid Idempotency-Key header", [{ path: ["Idempotency-Key"], message: "Use 1-200 safe characters" }]);
  }
  return value ?? undefined;
}

export async function readJsonBody(request: Request, maxBytes = MAX_REQUEST_BYTES): Promise<unknown> {
  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().startsWith("application/json")) {
    throw validationError("Content-Type must be application/json", [{ path: ["Content-Type"], message: "Expected application/json" }]);
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
    throw new ApiError("REQUEST_TOO_LARGE", "Request body is too large", 413);
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    throw validationError("Request body could not be read");
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new ApiError("REQUEST_TOO_LARGE", "Request body is too large", 413);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw validationError("Request body must be valid JSON");
  }
}

export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const details: ErrorDetail[] = result.error.issues.map((issue) => ({
    path: issue.path.map((part) => typeof part === "symbol" ? String(part) : part),
    message: issue.message,
  }));
  throw validationError("Request validation failed", details);
}
