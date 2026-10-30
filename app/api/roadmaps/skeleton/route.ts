import { roadmapSkeletonRequestSchema } from "@/lib/api-schemas";
import { generateRoadmapSkeleton } from "@/lib/server/services/roadmap-skeleton-service";
import { demoRateLimit } from "@/lib/server/rate-limit";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { idempotencyKey, parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    const key = idempotencyKey(request);
    const input = parseSchema(roadmapSkeletonRequestSchema, await readJsonBody(request));
    const roadmap = await demoRateLimit.run(
      "generation",
      demoRateLimit.identity(request),
      key,
      () => generateRoadmapSkeleton(input.userGoal, { requestId: correlationId, signal: request.signal }),
    );
    return Response.json(roadmap, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId },
    });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} roadmap skeleton generation failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
