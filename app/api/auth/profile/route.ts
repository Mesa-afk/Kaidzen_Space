import { authProfileUpdateRequestSchema } from "@/lib/api-schemas";
import { getDatabase } from "@/lib/server/db";
import { requireUser, updateUserProfile } from "@/lib/server/services/auth-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";

export async function PATCH(request: Request) {
  const correlationId = requestId(request);
  try {
    const db = getDatabase();
    const currentUser = requireUser(request, db);
    const patch = parseSchema(authProfileUpdateRequestSchema, await readJsonBody(request));
    const user = updateUserProfile(db, currentUser.id, patch);
    return Response.json({ user }, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": correlationId },
    });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} auth profile update failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
