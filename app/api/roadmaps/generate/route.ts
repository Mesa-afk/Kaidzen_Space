import { generateRequestSchema, roadmapResponseSchema } from "@/lib/api-schemas";
import { assignRoadmapIds, createSystemPrompt, generateValidated, LlmConfigurationError, LlmRequestError } from "@/lib/llm";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const input = generateRequestSchema.safeParse(body);
  if (!input.success) return Response.json({ error: "Invalid request", details: input.error.flatten() }, { status: 400 });

  try {
    const roadmap = await generateValidated({
      systemPrompt: createSystemPrompt("roadmap"),
      userPrompt: `Составь Kaizen Roadmap. Тема/навык: ${input.data.topic}. Желаемый уровень: ${input.data.level}. Распредели план по реалистичному количеству дней.`,
      parse: (value) => assignRoadmapIds(roadmapResponseSchema.parse(value)),
    });
    return Response.json(roadmap, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof LlmConfigurationError) return Response.json({ error: "AI generation is not configured. Set LLM_API_KEY on the server." }, { status: 503 });
    console.error("Roadmap generation failed:", error);
    return Response.json({ error: error instanceof LlmRequestError ? "Could not generate a valid roadmap after three attempts" : "Roadmap validation failed after three attempts" }, { status: 502 });
  }
}
