import { findCycle, GraphInvariantError, replaceTemporaryIds, type TaskNode } from "@/lib/graph";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class LlmConfigurationError extends Error {}
export class LlmRequestError extends Error {}

export function getLlmConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmConfigurationError("OPENAI_API_KEY is not configured on the server");
  return { apiKey, model: process.env.OPENAI_MODEL || "gpt-4o-mini" };
}

export async function generateValidated<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  parse: (value: unknown) => T;
}): Promise<T> {
  const { apiKey, model } = getLlmConfig();
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(OPENAI_URL, {
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
      if (!response.ok) throw new LlmRequestError(`LLM provider returned HTTP ${response.status}`);
      const body: unknown = await response.json();
      const content = (body as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
      if (!content) throw new LlmRequestError("LLM provider returned an empty response");
      const json: unknown = JSON.parse(content);
      return options.parse(json);
    } catch (error) {
      lastError = error;
      if (error instanceof LlmConfigurationError) throw error;
      console.warn(`LLM attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new LlmRequestError(lastError instanceof Error ? lastError.message : "LLM generation failed");
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
