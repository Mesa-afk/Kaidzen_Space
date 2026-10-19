import { demoRateLimit } from "@/lib/server/rate-limit";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { idempotencyKey, readJsonBody, requestId } from "@/lib/server/validation/request";
import { generateDaySession } from "@/lib/server/services/day-session-service";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    const key = idempotencyKey(request);
    const body: unknown = await readJsonBody(request);
    const session = await demoRateLimit.run(
      "day-session",
      demoRateLimit.identity(request),
      key,
      () => generateDaySession(body, { requestId: correlationId, signal: request.signal }),
    );
    return Response.json(session, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId },
    });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} day session generation failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
