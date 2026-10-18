import { splitRequestSchema } from "@/lib/api-schemas";
import { splitRoadmapTask } from "@/lib/server/services/split-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { idempotencyKey, parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";
import { demoRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    const key = idempotencyKey(request);
    const input = parseSchema(splitRequestSchema, await readJsonBody(request));
    const result = await demoRateLimit.run("split", demoRateLimit.identity(request), key, () => splitRoadmapTask({ ...input, requestId: correlationId, signal: request.signal }));
    return Response.json(result, { headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId } });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) console.error(`[api] request=${correlationId} task split failed`);
    return apiErrorResponse(error, correlationId);
  }
}
