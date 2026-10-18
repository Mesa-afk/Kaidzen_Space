import { roadmapTaskSchema } from "./api-schemas";
import type { TaskNode } from "./graph";
import { z } from "zod";

const serverGraphsSchema = z.record(z.string(), z.array(roadmapTaskSchema));

/** Fetches optional server progress without being coupled to hydration lifecycle. */
export async function fetchServerFocusGraphs(roadmapId: string, signal?: AbortSignal): Promise<Record<string, TaskNode[]>> {
  const response = await fetch(`/api/roadmaps/${encodeURIComponent(roadmapId)}/progress`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Could not synchronize roadmap progress");
  const payload: unknown = await response.json();
  const parsed = serverGraphsSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Server returned invalid roadmap progress");
  return parsed.data;
}
