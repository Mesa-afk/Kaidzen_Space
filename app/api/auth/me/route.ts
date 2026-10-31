import { requireUser } from "@/lib/server/services/auth-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { requestId } from "@/lib/server/validation/request";

export async function GET(request: Request) {
  const correlationId = requestId(request);
  try {
    const user = requireUser(request);
    return Response.json({ user }, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId },
    });
  } catch (error) {
    return apiErrorResponse(error, correlationId);
  }
}
