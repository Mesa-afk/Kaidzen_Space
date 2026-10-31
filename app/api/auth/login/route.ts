import { authLoginRequestSchema } from "@/lib/api-schemas";
import {
  assertLoginAllowed,
  clearLoginFailures,
  loginThrottleKey,
  recordLoginFailure,
} from "@/lib/server/auth-rate-limit";
import { getDatabase } from "@/lib/server/db";
import {
  buildSessionCookie,
  createSession,
  verifyCredentials,
} from "@/lib/server/services/auth-service";
import { ApiError, apiErrorResponse } from "@/lib/server/validation/errors";
import { parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    const input = parseSchema(authLoginRequestSchema, await readJsonBody(request));
    const throttleKey = loginThrottleKey(request, input.email);
    assertLoginAllowed(throttleKey);

    const db = getDatabase();
    const user = await verifyCredentials(db, input.email, input.password);
    if (!user) {
      recordLoginFailure(throttleKey);
      throw new ApiError("AUTH_INVALID_CREDENTIALS", "Invalid email or password", 401);
    }
    clearLoginFailures(throttleKey);

    const { token } = createSession(db, user.id);
    return Response.json({ user }, {
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": correlationId,
        "Set-Cookie": buildSessionCookie(request, token),
      },
    });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} auth login failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
