import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dedupeRoadmaps, roadmapSourceId, type Roadmap } from "./roadmaps";
import type { TaskNode } from "./graph";
import type { DailySessionResponse, StoredDaySession } from "./day-session-contract";
import { canReplaceUnstartedDayGraph, migrateDaySessionState, storeGeneratedDaySession } from "./day-session-store";

export type ThemeMode = "light" | "dark";

type KaizenState = {
  myRoadmaps: Roadmap[];
  focusGraphs: Record<string, TaskNode[]>;
  daySessions: Record<string, StoredDaySession>;
  daySessionRequestKeys: Record<string, string>;
  themeMode: ThemeMode;
  soundEnabled: boolean;
  likedRoadmapIds: string[]; // Track liked roadmap IDs
  addRoadmap: (roadmap: Roadmap) => void;
  removeRoadmap: (id: string) => void;
  setFocusGraph: (key: string, graph: TaskNode[]) => void;
  updateFocusGraph: (key: string, graph: TaskNode[]) => void;
  mergeServerFocusGraphs: (graphs: Record<string, TaskNode[]>) => void;
  setDaySession: (key: string, session: StoredDaySession) => void;
  setDaySessionWithGraph: (key: string, session: StoredDaySession, graph: TaskNode[]) => void;
  saveGeneratedDaySession: (key: string, response: DailySessionResponse) => void;
  setDaySessionRequestKey: (key: string, requestKey: string) => void;
  addDaySessionTaskMetadata: (key: string, tasks: StoredDaySession["tasks"]) => void;
  markDaySessionCompleted: (key: string, completedAt: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleSound: () => void;
  toggleLike: (roadmapId: string) => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  focusGraphs: {},
  daySessions: {},
  daySessionRequestKeys: {},
  themeMode: "light",
  soundEnabled: true,
  likedRoadmapIds: [],
  addRoadmap: (roadmap) => set((state) => {
    const sourceId = roadmapSourceId(roadmap);
    if (state.myRoadmaps.some((item) => roadmapSourceId(item) === sourceId)) return state;
    return { myRoadmaps: [{ ...roadmap, sourceId }, ...state.myRoadmaps] };
  }),
  removeRoadmap: (id) => set((state) => {
    const roadmap = state.myRoadmaps.find((item) => item.id === id);
    if (!roadmap) return state;
    const prefix = `${roadmap.id}:`;
    const focusGraphs = Object.fromEntries(Object.entries(state.focusGraphs).filter(([key]) => !key.startsWith(prefix)));
    const daySessions = Object.fromEntries(Object.entries(state.daySessions).filter(([key]) => !key.startsWith(prefix)));
    const daySessionRequestKeys = Object.fromEntries(Object.entries(state.daySessionRequestKeys).filter(([key]) => !key.startsWith(prefix)));
    return { myRoadmaps: state.myRoadmaps.filter((item) => item.id !== id), focusGraphs, daySessions, daySessionRequestKeys };
  }),
  setFocusGraph: (key, graph) => set((state) => state.focusGraphs[key] ? state : { focusGraphs: { ...state.focusGraphs, [key]: graph } }),
  updateFocusGraph: (key, graph) => set((state) => ({ focusGraphs: { ...state.focusGraphs, [key]: graph } })),
  // Local hydrated progress wins on key conflicts; the UI can request a
  // deliberate conflict resolution later instead of losing offline work.
  mergeServerFocusGraphs: (graphs) => set((state) => {
    const merged = { ...graphs, ...state.focusGraphs };
    return { focusGraphs: merged };
  }),
  setDaySession: (key, session) => set((state) => state.daySessions[key]
    ? state
    : {
      daySessions: { ...state.daySessions, [key]: session },
      daySessionRequestKeys: Object.fromEntries(Object.entries(state.daySessionRequestKeys).filter(([storedKey]) => storedKey !== key)),
    }),
  setDaySessionWithGraph: (key, session, graph) => set((state) => {
    if (state.daySessions[key]) return state;
    return {
      daySessions: { ...state.daySessions, [key]: session },
      daySessionRequestKeys: Object.fromEntries(Object.entries(state.daySessionRequestKeys).filter(([storedKey]) => storedKey !== key)),
      focusGraphs: state.focusGraphs[key]?.length
        ? state.focusGraphs
        : { ...state.focusGraphs, [key]: graph },
    };
  }),
  saveGeneratedDaySession: (key, response) => set((state) => {
    const existingGraph = state.focusGraphs[key] ?? [];
    if (state.daySessions[key] || !canReplaceUnstartedDayGraph(existingGraph)) return state;
    const session = storeGeneratedDaySession(response);
    return {
      daySessions: { ...state.daySessions, [key]: session },
      daySessionRequestKeys: Object.fromEntries(Object.entries(state.daySessionRequestKeys).filter(([storedKey]) => storedKey !== key)),
      focusGraphs: { ...state.focusGraphs, [key]: response.tasks.map((task) => task.task) },
    };
  }),
  setDaySessionRequestKey: (key, requestKey) => set((state) => {
    if (state.daySessions[key] || state.daySessionRequestKeys[key] === requestKey) return state;
    return { daySessionRequestKeys: { ...state.daySessionRequestKeys, [key]: requestKey } };
  }),
  addDaySessionTaskMetadata: (key, tasks) => set((state) => {
    const session = state.daySessions[key];
    if (!session) return state;
    const byTaskId = new Map(session.tasks.map((task) => [task.taskId, task]));
    tasks.forEach((task) => byTaskId.set(task.taskId, task));
    return { daySessions: { ...state.daySessions, [key]: { ...session, tasks: [...byTaskId.values()] } } };
  }),
  markDaySessionCompleted: (key, completedAt) => set((state) => {
    const session = state.daySessions[key];
    if (!session || session.completedAt) return state;
    return { daySessions: { ...state.daySessions, [key]: { ...session, completedAt } } };
  }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleLike: (roadmapId) => set((state) => ({
    likedRoadmapIds: state.likedRoadmapIds.includes(roadmapId)
      ? state.likedRoadmapIds.filter((id) => id !== roadmapId)
      : [...state.likedRoadmapIds, roadmapId],
  })),
}), {
  name: "kaizen-roadmaps",
  version: 6,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => {
    const state = persistedState as KaizenState;
    return {
      ...state,
      ...migrateDaySessionState(state),
      myRoadmaps: dedupeRoadmaps(state.myRoadmaps ?? []),
      themeMode: state.themeMode ?? "light",
      soundEnabled: state.soundEnabled ?? true,
      likedRoadmapIds: state.likedRoadmapIds ?? [],
    };
  },
}));
