import type { TaskNode } from "@/lib/graph";

export type RoadmapOwner = { userId: string };
export type StoredRoadmap = {
  id: string;
  sourceId: string | null;
  owner: RoadmapOwner;
  projectTitle: string;
  projectEmoji: string;
  days: { dayNumber: number; tasks: TaskNode[] }[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Durable implementations must provide a real database transaction here.
 * The application services depend on this contract rather than a storage
 * implementation, so adding Postgres/Prisma later does not change API logic.
 */
export interface RoadmapRepository {
  get(id: string, owner: RoadmapOwner): Promise<StoredRoadmap | null>;
  save(roadmap: StoredRoadmap): Promise<void>;
  replaceGraph(id: string, owner: RoadmapOwner, days: StoredRoadmap["days"]): Promise<StoredRoadmap>;
  transaction<T>(work: (repository: RoadmapRepository) => Promise<T>): Promise<T>;
}
