import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dedupeRoadmaps, roadmapSourceId, type Roadmap } from "./roadmaps";
import type { TaskNode } from "./graph";

export type ThemeMode = "light" | "dark";

type KaizenState = {
  myRoadmaps: Roadmap[];
  focusGraphs: Record<string, TaskNode[]>;
  themeMode: ThemeMode;
  soundEnabled: boolean;
  likedRoadmapIds: string[]; // Track liked roadmap IDs
  addRoadmap: (roadmap: Roadmap) => void;
  removeRoadmap: (id: string) => void;
  setFocusGraph: (key: string, graph: TaskNode[]) => void;
  updateFocusGraph: (key: string, graph: TaskNode[]) => void;
  mergeServerFocusGraphs: (graphs: Record<string, TaskNode[]>) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleSound: () => void;
  toggleLike: (roadmapId: string) => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  focusGraphs: {},
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
    return { myRoadmaps: state.myRoadmaps.filter((item) => item.id !== id), focusGraphs };
  }),
  setFocusGraph: (key, graph) => set((state) => state.focusGraphs[key] ? state : { focusGraphs: { ...state.focusGraphs, [key]: graph } }),
  updateFocusGraph: (key, graph) => set((state) => ({ focusGraphs: { ...state.focusGraphs, [key]: graph } })),
  // Local hydrated progress wins on key conflicts; the UI can request a
  // deliberate conflict resolution later instead of losing offline work.
  mergeServerFocusGraphs: (graphs) => set((state) => {
    const merged = { ...graphs, ...state.focusGraphs };
    return { focusGraphs: merged };
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
  version: 4,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => {
    const state = persistedState as KaizenState;
    return {
      ...state,
      myRoadmaps: dedupeRoadmaps(state.myRoadmaps ?? []),
      themeMode: state.themeMode ?? "light",
      soundEnabled: state.soundEnabled ?? true,
      likedRoadmapIds: state.likedRoadmapIds ?? [],
    };
  },
}));
