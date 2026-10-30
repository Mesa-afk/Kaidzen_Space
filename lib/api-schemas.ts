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
  for (const task of leaves) {
    if (task.xp_weight < 1) context.addIssue({ code: "custom", message: "Leaf tasks must receive at least 1 XP", path: ["tasks"] });
  }
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

export const roadmapSkeletonRequestSchema = z.object({
  userGoal: z.string().trim().min(2).max(500),
}).strict();

export const roadmapSubskillSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(400),
  day_start: z.number().int().min(1).max(66),
  day_end: z.number().int().min(1).max(66),
}).strict();

export const roadmapSkeletonModelSchema = z.object({
  folder_title: z.string().trim().min(2).max(80),
  emoji: z.string().trim().min(1).max(12),
  lovable_project: z.string().trim().min(10).max(240),
  target_performance_level: z.string().trim().min(10).max(240),
  estimated_global_hours: z.number().positive().max(100_000),
  subskills: z.array(roadmapSubskillSchema).min(6).max(8),
}).strict().superRefine((model, context) => {
  const ids = model.subskills.map((subskill) => subskill.id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", message: "Subskill IDs must be unique", path: ["subskills"] });
  }
  const ordered = [...model.subskills].sort((a, b) => a.day_start - b.day_start);
  let expectedDay = 1;
  for (const subskill of ordered) {
    if (subskill.day_start !== expectedDay || subskill.day_end < subskill.day_start) {
      context.addIssue({ code: "custom", message: "Subskill day ranges must be sequential and non-overlapping", path: ["subskills"] });
      break;
    }
    expectedDay = subskill.day_end + 1;
  }
  if (expectedDay !== 67) {
    context.addIssue({ code: "custom", message: "Subskills must cover days 1 through 66", path: ["subskills"] });
  }
});

export const roadmapSkeletonDaySchema = z.object({
  day_number: z.number().int().min(1).max(66),
  title: z.string().min(1).max(40),
  subskill_id: z.string().min(1),
  tasks: z.array(roadmapTaskSchema).max(10),
}).strict();

export const roadmapSkeletonResponseSchema = roadmapSkeletonModelSchema.extend({
  planned_minutes: z.literal(1200),
  planned_days: z.literal(66),
  days: z.array(roadmapSkeletonDaySchema).length(66),
}).superRefine((response, context) => {
  const subskillByDay = new Map<number, string>();
  for (const subskill of response.subskills) {
    for (let day = subskill.day_start; day <= subskill.day_end; day += 1) {
      subskillByDay.set(day, subskill.id);
    }
  }
  response.days.forEach((day, index) => {
    if (day.day_number !== index + 1 || day.title !== `День ${index + 1}`) {
      context.addIssue({ code: "custom", message: "Roadmap days must be numbered 1 through 66", path: ["days", index] });
    }
    if (day.subskill_id !== subskillByDay.get(day.day_number)) {
      context.addIssue({ code: "custom", message: "Day subskill reference does not match its range", path: ["days", index, "subskill_id"] });
    }
    if (day.day_number !== 1 && day.tasks.length > 0) {
      context.addIssue({ code: "custom", message: "Only day 1 may contain tasks in the roadmap skeleton", path: ["days", index, "tasks"] });
    }
  });
  const firstDay = response.days[0];
  if (!firstDay || firstDay.tasks.length < 2) {
    context.addIssue({ code: "custom", message: "Day 1 must contain its starter tasks", path: ["days", 0, "tasks"] });
  }
});

export type RoadmapTask = z.infer<typeof roadmapTaskSchema>;
export type RoadmapResponse = z.infer<typeof roadmapResponseSchema>;
export type RoadmapSkeletonModel = z.infer<typeof roadmapSkeletonModelSchema>;
export type RoadmapSkeletonResponse = z.infer<typeof roadmapSkeletonResponseSchema>;
