import { getDatabase } from "@/lib/server/db";
import {
  buildClearSessionCookies,
  deleteSession,
  readSessionToken,
} from "@/lib/server/services/auth-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { requestId } from "@/lib/server/validation/request";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    deleteSession(getDatabase(), readSessionToken(request));

    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Request-Id": correlationId,
    });
    for (const cookie of buildClearSessionCookies(request)) {
      headers.append("Set-Cookie", cookie);
    }

    return Response.json({ ok: true }, { headers });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} auth logout failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
