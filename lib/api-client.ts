import type { TaskNode } from "./graph";
import {
  roadmapResponseSchema,
  roadmapSkeletonResponseSchema,
  splitResponseSchema,
  type RoadmapResponse,
  type RoadmapSkeletonResponse,
} from "./api-schemas";
import { dailySessionResponseSchema, type GenerateDaySessionRequest, type DailySessionResponse } from "./day-session-contract";

export class ApiClientError extends Error {
  constructor(message: string, readonly code = "API_ERROR") { super(message); }
}

async function postJson<T>(url: string, body: unknown, parse: (value: unknown) => T, requestKey = crypto.randomUUID()): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiClientError(error?.error?.message ?? "Request failed", error?.error?.code ?? "API_ERROR");
  }
  try {
    return parse(payload);
  } catch {
    throw new ApiClientError("Server returned an invalid response", "INVALID_RESPONSE");
  }
}

export function isBackendEnabled() {
  return process.env.NEXT_PUBLIC_BACKEND_MODE !== "mock";
}

export function generateRoadmapApi(topic: string, level: string): Promise<RoadmapResponse> {
  return postJson("/api/roadmaps/generate", { topic, level }, (value) => roadmapResponseSchema.parse(value));
}

export function generateRoadmapSkeletonApi(userGoal: string): Promise<RoadmapSkeletonResponse> {
  return postJson("/api/roadmaps/skeleton", { userGoal }, (value) => roadmapSkeletonResponseSchema.parse(value));
}

export function splitTaskApi(task: TaskNode, graph: TaskNode[]): Promise<{ tasks: TaskNode[] }> {
  return postJson("/api/tasks/split", { task, graph }, (value) => splitResponseSchema.parse(value));
}

export function generateDaySessionApi(
  input: GenerateDaySessionRequest,
  idempotencyKey: string,
): Promise<DailySessionResponse> {
  return postJson(
    "/api/roadmaps/day/generate",
    input,
    (value) => dailySessionResponseSchema.parse(value),
    idempotencyKey,
  );
}
