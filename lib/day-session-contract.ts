import { z } from "zod";
import { roadmapTaskSchema } from "./api-schemas";
import type { CognitiveRole, SchedulerPhase } from "./kaizenScheduler";
import type { IcnUModifier } from "./icnuModifiers";

/** Session-only task data stays separate from the persisted TaskNode contract. */
export type DailySessionTask = {
  task: z.infer<typeof roadmapTaskSchema>;
  durationSeconds: number;
  cognitiveRole: CognitiveRole;
  icnuTrigger: IcnUModifier;
  instruction: string;
  evidenceMethod: string;
};

export type DailySessionResponse = {
  roadmapId: string;
  dayNumber: number;
  effectiveDay: number;
  phase: SchedulerPhase;
  subskill: { id: string; title: string; description: string };
  dailyBudgetSeconds: number;
  creditedSecondsBefore: number;
  projectedCreditedSeconds: number;
  taskCount: number;
  repeatedSubskill: { id: string; title: string; description: string } | null;
  modifiersRecycled: boolean;
  tasks: DailySessionTask[];
};

export type StoredDailySessionTask = Omit<DailySessionTask, "task"> & { taskId: string };

export type StoredDaySession = Omit<DailySessionResponse, "tasks" | "dailyBudgetSeconds"> & {
  /** Legacy local graphs can predate the 20-minute Kaufman budget. */
  dailyBudgetSeconds: number;
  tasks: StoredDailySessionTask[];
  createdAt: string;
  completedAt?: string;
};

const subskillContextSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
}).strict();

export const sessionHistoryEntrySchema = z.object({
  effectiveDay: z.number().int().min(1).max(66).optional(),
  dayNumber: z.number().int().min(1).max(66).optional(),
  completed: z.boolean().default(true),
  subskillId: z.string().trim().min(1).max(80).optional(),
  subskillTitle: z.string().trim().min(1).max(120).optional(),
  subskillDescription: z.string().trim().max(500).optional(),
  creditedSeconds: z.number().int().min(0).max(72_000).default(0),
}).strict().refine((entry) => entry.effectiveDay !== undefined || entry.dayNumber !== undefined, {
  message: "History entry needs effectiveDay or dayNumber",
});

/**
 * This is a demo-mode context snapshot from local progress. Derived values
 * (phase, budget, roles, repetitions, modifiers, task count) are deliberately
 * not accepted in the request and are recomputed by the service.
 */
export const generateDaySessionRequestSchema = z.object({
  roadmapId: z.string().trim().min(1).max(120),
  roadmapTitle: z.string().trim().min(1).max(120),
  roadmapDescription: z.string().trim().max(500).optional(),
  goal: z.string().trim().min(2).max(500).optional(),
  lovableProject: z.string().trim().min(2).max(500).optional(),
  targetPerformanceLevel: z.string().trim().min(2).max(500).optional(),
  dayNumber: z.number().int().min(1).max(66),
  dayTitle: z.string().trim().min(1).max(120),
  subskill: subskillContextSchema.optional(),
  effectiveDay: z.number().int().min(1).max(66).optional(),
  phase: z.enum(["AMYGDALA_BYPASS", "RAMP_UP", "KAUFMAN_CRUISE", "RSD_RECOVERY"]).optional(),
  daysMissed: z.number().int().min(0).max(365).default(0),
  wasTooHard: z.boolean().default(false),
  sessionHistory: z.array(sessionHistoryEntrySchema).max(500).default([]),
  usedModifierIds: z.array(z.string().trim().min(1).max(80)).max(60).default([]),
}).strict();

const icnuTriggerSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["INTEREST", "CHALLENGE", "NOVELTY", "URGENCY", "PASSION_PLAY"]),
  label: z.string().min(1),
  instruction: z.string().min(1),
}).strict();

const sessionSubskillSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
}).strict();

export const dailySessionTaskSchema = z.object({
  task: roadmapTaskSchema,
  durationSeconds: z.number().int().min(30).max(1200),
  cognitiveRole: z.enum([
    "SCAFFOLD_SETUP",
    "MIND_SCULPT_ANCHOR",
    "MENTAL_HOOK",
    "FAST_FEEDBACK_DRILL",
    "INVERSION_PLAY",
    "SPACED_RETRIEVAL",
    "SPEED_SPRINT",
    "BIO_RESET",
    "CHALLENGE_TWIST",
    "PROJECT_BUILD",
  ]),
  icnuTrigger: icnuTriggerSchema,
  instruction: z.string().trim().min(5).max(200),
  evidenceMethod: z.string().trim().min(3).max(120),
}).strict();

export const dailySessionResponseSchema = z.object({
  roadmapId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(66),
  effectiveDay: z.number().int().min(1).max(66),
  phase: z.enum(["AMYGDALA_BYPASS", "RAMP_UP", "KAUFMAN_CRUISE", "RSD_RECOVERY"]),
  subskill: sessionSubskillSchema,
  dailyBudgetSeconds: z.number().int().min(30).max(1200),
  creditedSecondsBefore: z.number().int().min(0).max(72_000),
  projectedCreditedSeconds: z.number().int().min(0).max(72_000),
  taskCount: z.number().int().min(1).max(10),
  repeatedSubskill: sessionSubskillSchema.nullable(),
  modifiersRecycled: z.boolean(),
  tasks: z.array(dailySessionTaskSchema).min(1).max(10),
}).strict().superRefine((session, context) => {
  if (session.taskCount !== session.tasks.length) {
    context.addIssue({ code: "custom", message: "taskCount must match the generated tasks", path: ["taskCount"] });
  }
  const plannedSeconds = session.tasks.reduce((sum, task) => sum + task.durationSeconds, 0);
  if (plannedSeconds !== session.dailyBudgetSeconds) {
    context.addIssue({ code: "custom", message: "Task durations must sum to dailyBudgetSeconds", path: ["tasks"] });
  }
  const xp = session.tasks.reduce((sum, item) => sum + (item.task.type === "task" ? item.task.xp_weight : 0), 0);
  if (xp !== 100) context.addIssue({ code: "custom", message: "Daily task XP must total 100", path: ["tasks"] });
});

export type GenerateDaySessionRequest = z.input<typeof generateDaySessionRequestSchema>;
export type ParsedGenerateDaySessionRequest = z.output<typeof generateDaySessionRequestSchema>;
