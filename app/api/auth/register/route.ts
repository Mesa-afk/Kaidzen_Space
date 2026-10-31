import { authRegisterRequestSchema } from "@/lib/api-schemas";
import { assertAndRecordRegisterAttempt } from "@/lib/server/auth-rate-limit";
import { getDatabase } from "@/lib/server/db";
import {
  buildSessionCookie,
  createSession,
  createUser,
} from "@/lib/server/services/auth-service";
import { apiErrorResponse } from "@/lib/server/validation/errors";
import { parseSchema, readJsonBody, requestId } from "@/lib/server/validation/request";

export async function POST(request: Request) {
  const correlationId = requestId(request);
  try {
    assertAndRecordRegisterAttempt(request);
    const input = parseSchema(authRegisterRequestSchema, await readJsonBody(request));
    const db = getDatabase();
    const user = await createUser(db, input);
    const { token } = createSession(db, user.id);
    return Response.json({ user }, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": correlationId,
        "Set-Cookie": buildSessionCookie(request, token),
      },
    });
  } catch (error) {
    if (!(error instanceof Error && error.name === "ApiError")) {
      console.error(`[api] request=${correlationId} auth register failed`);
    }
    return apiErrorResponse(error, correlationId);
  }
}
