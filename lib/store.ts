import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Roadmap } from "./roadmaps";

type KaizenState = {
  myRoadmaps: Roadmap[];
  likedIds: string[];
  addRoadmap: (roadmap: Roadmap) => void;
  toggleLike: (id: string) => void;
};

export const useKaizenStore = create<KaizenState>()(persist((set) => ({
  myRoadmaps: [],
  likedIds: [],
  addRoadmap: (roadmap) => set((state) => state.myRoadmaps.some((item) => item.id === roadmap.id) ? state : { myRoadmaps: [roadmap, ...state.myRoadmaps] }),
  toggleLike: (id) => set((state) => ({ likedIds: state.likedIds.includes(id) ? state.likedIds.filter((item) => item !== id) : [...state.likedIds, id] })),
}), {
  name: "kaizen-roadmaps",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  migrate: (persistedState) => persistedState as KaizenState,
}));
