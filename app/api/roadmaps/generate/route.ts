import { generateRequestSchema } from "@/lib/api-schemas";
import { generateRoadmap } from "@/lib/server/services/roadmap-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { idempotencyKey, parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    idempotencyKey(request);
    const input = parseSchema(generateRequestSchema, await readJsonBody(request));
    const roadmap = await generateRoadmap({ ...input, requestId: correlationId, signal: request.signal });
    return Response.json(roadmap, { headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId } });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) console.error(`[api] request=${correlationId} roadmap generation failed`);
    return apiErrorResponse(error, correlationId);
  }
}
