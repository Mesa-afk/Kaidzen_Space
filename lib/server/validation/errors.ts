export type ErrorDetail = { path?: (string | number)[]; message: string };

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function validationError(message = "Request validation failed", details: ErrorDetail[] = []) {
  return new ApiError("VALIDATION_ERROR", message, 400, details);
}

export function apiErrorResponse(error: unknown, requestId: string) {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  return Response.json({
    error: { code: apiError.code, message: apiError.message, details: apiError.details },
  }, {
    status: apiError.status,
    headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
  });
}
