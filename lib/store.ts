import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dedupeRoadmaps, roadmapSourceId, type Roadmap } from "./roadmaps";
import type { TaskNode } from "./graph";

export type ThemeMode = "light" | "dark";

type KaizenState = {
  myRoadmaps: Roadmap[];
  likedIds: string[];
  focusGraphs: Record<string, TaskNode[]>;
  themeMode: ThemeMode;
  soundEnabled: boolean;
  addRoadmap: (roadmap: Roadmap) => void;
  removeRoadmap: (id: string) => void;
  toggleLike: (id: string) => void;
  setFocusGraph: (key: string, graph: TaskNode[]) => void;
  updateFocusGraph: (key: string, graph: TaskNode[]) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleSound: () => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  likedIds: [],
  focusGraphs: {},
  themeMode: "light",
  soundEnabled: true,
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
  toggleLike: (id) => set((state) => ({ likedIds: state.likedIds.includes(id) ? state.likedIds.filter((item) => item !== id) : [...state.likedIds, id] })),
  setFocusGraph: (key, graph) => set((state) => state.focusGraphs[key] ? state : { focusGraphs: { ...state.focusGraphs, [key]: graph } }),
  updateFocusGraph: (key, graph) => set((state) => ({ focusGraphs: { ...state.focusGraphs, [key]: graph } })),
  setThemeMode: (mode) => set({ themeMode: mode }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}), {
  name: "kaizen-roadmaps",
  version: 3,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => {
    const state = persistedState as KaizenState;
    return {
      ...state,
      myRoadmaps: dedupeRoadmaps(state.myRoadmaps ?? []),
      themeMode: state.themeMode ?? "light",
      soundEnabled: state.soundEnabled ?? true,
    };
  },
}));
