import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Roadmap } from "./roadmaps";
import type { TaskNode } from "./graph";

type KaizenState = {
  myRoadmaps: Roadmap[];
  likedIds: string[];
  focusGraphs: Record<string, TaskNode[]>;
  addRoadmap: (roadmap: Roadmap) => void;
  toggleLike: (id: string) => void;
  setFocusGraph: (key: string, graph: TaskNode[]) => void;
  updateFocusGraph: (key: string, graph: TaskNode[]) => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  likedIds: [],
  focusGraphs: {},
  addRoadmap: (roadmap) => set((state) => state.myRoadmaps.some((item) => item.id === roadmap.id) ? state : { myRoadmaps: [roadmap, ...state.myRoadmaps] }),
  toggleLike: (id) => set((state) => ({ likedIds: state.likedIds.includes(id) ? state.likedIds.filter((item) => item !== id) : [...state.likedIds, id] })),
  setFocusGraph: (key, graph) => set((state) => state.focusGraphs[key] ? state : { focusGraphs: { ...state.focusGraphs, [key]: graph } }),
  updateFocusGraph: (key, graph) => set((state) => ({ focusGraphs: { ...state.focusGraphs, [key]: graph } })),
}), {
  name: "kaizen-roadmaps",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => persistedState as KaizenState,
}));
