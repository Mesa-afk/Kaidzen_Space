import { z } from "zod";

export const roadmapTaskSchema = z.object({
  id: z.string().min(1),
  parent_id: z.string().nullable(),
  type: z.enum(["task", "container"]),
  status: z.enum(["pending", "completed", "skipped"]),
  title: z.string().trim().min(1).max(240),
  duration_minutes: z.number().int().min(1).max(60),
  xp_weight: z.number().int().min(0).max(100),
  dependencies: z.array(z.string()).max(100),
}).strict();

export const roadmapDaySchema = z.object({
  day_number: z.number().int().min(1),
  tasks: z.array(roadmapTaskSchema).min(1).max(40),
}).superRefine((day, context) => {
  const leaves = day.tasks.filter((task) => task.type === "task");
  const xp = leaves.reduce((sum, task) => sum + task.xp_weight, 0);
  if (xp !== 100) context.addIssue({ code: "custom", message: `Day ${day.day_number} leaf-task xp_weight sum must equal 100 (received ${xp})`, path: ["tasks"] });
  const ids = new Set(day.tasks.map((task) => task.id));
  if (ids.size !== day.tasks.length) context.addIssue({ code: "custom", message: "Task IDs must be unique within a day", path: ["tasks"] });
  for (const task of day.tasks) {
    for (const dependency of task.dependencies) {
      if (!ids.has(dependency)) context.addIssue({ code: "custom", message: `Unknown dependency ${dependency}`, path: ["tasks"] });
    }
    if (task.parent_id !== null && !ids.has(task.parent_id)) context.addIssue({ code: "custom", message: `Unknown parent ${task.parent_id}`, path: ["tasks"] });
  }
});

export const roadmapResponseSchema = z.object({
  project_title: z.string().trim().min(1).max(100),
  project_emoji: z.string().trim().min(1).max(12),
  days: z.array(roadmapDaySchema).min(1).max(90),
}).superRefine((roadmap, context) => {
  const numbers = roadmap.days.map((day) => day.day_number);
  if (new Set(numbers).size !== numbers.length) context.addIssue({ code: "custom", message: "Day numbers must be unique", path: ["days"] });
});

export const generateRequestSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  level: z.string().trim().min(2).max(100),
}).strict();

export const splitRequestSchema = z.object({
  task: roadmapTaskSchema.extend({ type: z.literal("task"), status: z.literal("pending") }),
  graph: z.array(roadmapTaskSchema).max(100).default([]),
}).strict();

export const splitResponseSchema = z.object({ tasks: z.array(roadmapTaskSchema).min(2).max(5) });

export type RoadmapTask = z.infer<typeof roadmapTaskSchema>;
