import { findCycle, GraphInvariantError, replaceTemporaryIds, type TaskNode } from "@/lib/graph";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const MAX_PROMPT_CHARS = 12_000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const DEFAULT_BASE_URL = "https://api.daluobo.cc.cd/v1";
const DEFAULT_MODEL = "deepseek-v4.1-flash";

export class LlmConfigurationError extends Error { readonly code = "LLM_NOT_CONFIGURED"; }
export class LlmRequestError extends Error { constructor(message: string, readonly code = "LLM_REQUEST_FAILED") { super(message); } }

export function getLlmConfig() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new LlmConfigurationError("LLM_API_KEY is not configured on the server");
  const baseUrl = (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { apiKey, model: process.env.LLM_MODEL || DEFAULT_MODEL, url: `${baseUrl}/chat/completions` };
}

export async function generateValidated<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  parse: (value: unknown) => T;
  requestId?: string;
  signal?: AbortSignal;
}): Promise<T> {
  const { apiKey, model, url } = getLlmConfig();
  if (options.systemPrompt.length > MAX_PROMPT_CHARS || options.userPrompt.length > MAX_PROMPT_CHARS) {
    throw new LlmRequestError("LLM prompt exceeds the permitted size", "LLM_INPUT_TOO_LARGE");
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
        }),
      });
      if (!response.ok) {
        if (response.status === 429) throw new LlmRequestError("LLM provider rate limit", "LLM_RATE_LIMITED");
        throw new LlmRequestError("LLM provider request failed", response.status >= 500 ? "LLM_PROVIDER_UNAVAILABLE" : "LLM_REQUEST_REJECTED");
      }
      const raw = await response.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_RESPONSE_BYTES) throw new LlmRequestError("LLM provider response is too large", "LLM_RESPONSE_TOO_LARGE");
      let body: unknown;
      try { body = JSON.parse(raw); } catch { throw new LlmRequestError("LLM provider returned malformed JSON", "LLM_MALFORMED_RESPONSE"); }
      const content = (body as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
      if (!content?.trim()) throw new LlmRequestError("LLM provider returned an empty response", "LLM_EMPTY_RESPONSE");
      let json: unknown;
      try { json = JSON.parse(content); } catch { throw new LlmRequestError("LLM provider returned malformed content", "LLM_MALFORMED_CONTENT"); }
      try { return options.parse(json); } catch { throw new LlmRequestError("LLM provider response failed schema validation", "LLM_SCHEMA_INVALID"); }
    } catch (error) {
      if (error instanceof LlmConfigurationError) throw error;
      if (error instanceof Error && error.name === "AbortError") lastError = new LlmRequestError("LLM provider timed out", "LLM_TIMEOUT");
      else if (error instanceof LlmRequestError) lastError = error;
      else lastError = new LlmRequestError("LLM provider request failed", "LLM_NETWORK_ERROR");
      const safeCode = lastError instanceof LlmRequestError ? lastError.code : "LLM_REQUEST_FAILED";
      console.warn(`[llm] request=${options.requestId ?? "unknown"} attempt=${attempt}/${MAX_ATTEMPTS} code=${safeCode}`);
      if (options.signal?.aborted) throw new LlmRequestError("LLM request cancelled", "LLM_CANCELLED");
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }
  throw lastError instanceof LlmRequestError ? lastError : new LlmRequestError("LLM generation failed");
}

export function assignRoadmapIds<T extends { days: { tasks: TaskNode[] }[] }>(roadmap: T): T {
  const days = roadmap.days.map((day) => {
    const tasks = replaceTemporaryIds(day.tasks);
    const cycle = findCycle(tasks);
    if (cycle) throw new GraphInvariantError(`Dependency cycle detected: ${cycle.join(" -> ")}`);
    return { ...day, tasks };
  });
  return { ...roadmap, days };
}

export function createSystemPrompt(kind: "roadmap" | "split") {
  const base = "Ты создаёшь практичные Kaizen Roadmaps для людей с СДВГ. Подбирай реалистичный объём дней под цель и уровень. Каждый шаг — конкретное действие с проверяемым глаголом, длительностью 5–15 минут. Возвращай только валидный JSON без Markdown.";
  if (kind === "roadmap") return `${base} Для каждого отдельного дня сумма xp_weight всех задач типа task (листовых задач) должна быть строго равна 100. Это жёсткий инвариант, проверь сумму по каждому дню отдельно. Используй временные уникальные ID, status pending, type task, parent_id null, dependencies []. Верни {"project_title":"...","project_emoji":"...","days":[{"day_number":1,"tasks":[{"id":"temp_1","parent_id":null,"type":"task","status":"pending","title":"...","duration_minutes":5,"xp_weight":100,"dependencies":[]}]}]}.`;
  return `${base} Разбей переданную задачу на 2–5 конкретных микрошагов с длительностью 2–10 минут. Сохраняй ID родителя в parent_id. xp_weight можешь вернуть нулевым: сервер распределит вес точно. Верни только {"tasks":[{"id":"temp_split_1","parent_id":"PARENT_ID","type":"task","status":"pending","title":"...","duration_minutes":5,"xp_weight":0,"dependencies":[]}]}.`;
}

export function normalizeSplitTasks(tasks: TaskNode[], parent: TaskNode, graph: TaskNode[]) {
  if (tasks.length < 2) throw new GraphInvariantError("LLM must return at least two subtasks");
  const children = replaceTemporaryIds(tasks, graph);
  const base = Math.floor(parent.xp_weight / children.length);
  if (parent.xp_weight < children.length) throw new GraphInvariantError("Cannot split task: each child must receive at least 1 XP");
  return children.map((child, index) => ({
    ...child,
    parent_id: parent.id,
    type: "task" as const,
    status: "pending" as const,
    xp_weight: index === children.length - 1 ? parent.xp_weight - base * (children.length - 1) : base,
    dependencies: [...new Set([...parent.dependencies, ...child.dependencies])],
  }));
}
