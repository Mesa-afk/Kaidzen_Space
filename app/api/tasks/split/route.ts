import { splitRequestSchema, splitResponseSchema } from "@/lib/api-schemas";
import { createSystemPrompt, generateValidated, LlmConfigurationError, LlmRequestError } from "@/lib/llm";
import { splitTask, type TaskNode } from "@/lib/graph";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const input = splitRequestSchema.safeParse(body);
  if (!input.success) return Response.json({ error: "Invalid request", details: input.error.flatten() }, { status: 400 });
  const { task, graph: suppliedGraph } = input.data;
  if (task.xp_weight < 2) return Response.json({ error: "Task XP must be at least 2 to split" }, { status: 422 });
  const graph = suppliedGraph.some((node) => node.id === task.id) ? suppliedGraph : [...suppliedGraph, task];

  try {
    const response = await generateValidated({
      systemPrompt: createSystemPrompt("split"),
      userPrompt: `Раздроби задачу на микрошаги. Родительская задача: ${JSON.stringify(task)}. Контекст графа (только для понимания зависимостей): ${JSON.stringify(graph)}.`,
      parse: (value) => splitResponseSchema.parse(value),
    });
    const candidate = splitTask(graph as TaskNode[], task.id, response.tasks as TaskNode[]);
    const tasks = candidate.filter((node) => node.parent_id === task.id);
    return Response.json({ tasks }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof LlmConfigurationError) return Response.json({ error: "AI generation is not configured. Set OPENAI_API_KEY on the server." }, { status: 503 });
    console.error("Task splitting failed:", error);
    return Response.json({ error: error instanceof LlmRequestError ? "Could not split task after three attempts" : error instanceof Error ? error.message : "Task splitting failed" }, { status: 502 });
  }
}
