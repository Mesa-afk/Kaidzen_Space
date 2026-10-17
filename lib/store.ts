import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dedupeRoadmaps, roadmapSourceId, type Roadmap } from "./roadmaps";
import type { TaskNode } from "./graph";

type KaizenState = {
  myRoadmaps: Roadmap[];
  likedIds: string[];
  focusGraphs: Record<string, TaskNode[]>;
  addRoadmap: (roadmap: Roadmap) => void;
  removeRoadmap: (id: string) => void;
  toggleLike: (id: string) => void;
  setFocusGraph: (key: string, graph: TaskNode[]) => void;
  updateFocusGraph: (key: string, graph: TaskNode[]) => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  likedIds: [],
  focusGraphs: {},
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
}), {
  name: "kaizen-roadmaps",
  version: 2,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => {
    const state = persistedState as KaizenState;
    return { ...state, myRoadmaps: dedupeRoadmaps(state.myRoadmaps ?? []) };
  },
}));
