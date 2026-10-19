import { ApiError } from "./validation/errors";

export const AI_POLICY = {
  generationsPerUtcDay: 2,
  splitsPerUtcHour: 10,
  daySessionsPerUtcDay: 66,
};

type Entry<T> = { promise: Promise<T>; value?: T; expiresAt: number };

/** Process-local fallback. Replace with a distributed atomic store in production. */
class DemoRateLimit {
  private readonly usage = new Map<string, { count: number; expiresAt: number }>();
  private readonly requests = new Map<string, Entry<unknown>>();

  identity(request: Request) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded && forwarded.length <= 64 ? forwarded : "anonymous";
  }

  async run<T>(kind: "generation" | "split" | "day-session", identity: string, key: string | undefined, work: () => Promise<T>): Promise<T> {
    const requestKey = key ? `${kind}:${identity}:${key}` : undefined;
    if (requestKey) {
      const existing = this.requests.get(requestKey) as Entry<T> | undefined;
      if (existing) {
        if (existing.value !== undefined) return existing.value;
        throw new ApiError("REQUEST_IN_PROGRESS", "An identical request is already in progress", 409);
      }
    }
    const now = Date.now();
    const window = kind === "split" ? 3_600_000 : 86_400_000;
    const limit = kind === "generation"
      ? AI_POLICY.generationsPerUtcDay
      : kind === "split"
        ? AI_POLICY.splitsPerUtcHour
        : AI_POLICY.daySessionsPerUtcDay;
    const usageKey = `${kind}:${identity}`;
    const usage = this.usage.get(usageKey);
    if (!usage || usage.expiresAt <= now) this.usage.set(usageKey, { count: 0, expiresAt: now + window });
    const current = this.usage.get(usageKey)!;
    if (current.count >= limit) {
      const code = kind === "day-session" ? "DAY_SESSION_LIMIT_REACHED" : "GENERATION_LIMIT_REACHED";
      throw new ApiError(code, "AI usage limit reached", 429);
    }
    current.count += 1;
    const promise = work();
    if (requestKey) this.requests.set(requestKey, { promise, expiresAt: now + window });
    try {
      const value = await promise;
      if (requestKey) this.requests.set(requestKey, { promise: Promise.resolve(value), value, expiresAt: now + window });
      return value;
    } catch (error) {
      if (requestKey) this.requests.delete(requestKey);
      throw error;
    }
  }
}

export const demoRateLimit = new DemoRateLimit();
