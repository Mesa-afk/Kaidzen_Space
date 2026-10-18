import type { RoadmapRepository, RoadmapOwner, StoredRoadmap } from "./roadmap-repository";

/** Demo-only adapter. This is process memory, not production persistence. */
export class DemoRoadmapRepository implements RoadmapRepository {
  private readonly records = new Map<string, StoredRoadmap>();

  async get(id: string, owner: RoadmapOwner) {
    const record = this.records.get(id);
    return record && record.owner.userId === owner.userId ? structuredClone(record) : null;
  }

  async save(roadmap: StoredRoadmap) {
    if (this.records.has(roadmap.id)) throw new Error("Roadmap already exists");
    this.records.set(roadmap.id, structuredClone(roadmap));
  }

  async replaceGraph(id: string, owner: RoadmapOwner, days: StoredRoadmap["days"]) {
    const record = this.records.get(id);
    if (!record || record.owner.userId !== owner.userId) throw new Error("Roadmap not found");
    const updated = { ...record, days: structuredClone(days), updatedAt: new Date() };
    this.records.set(id, structuredClone(updated));
    return structuredClone(updated);
  }

  async transaction<T>(work: (repository: RoadmapRepository) => Promise<T>): Promise<T> {
    const snapshot = new Map([...this.records].map(([id, record]) => [id, structuredClone(record)]));
    try {
      return await work(this);
    } catch (error) {
      this.records.clear();
      for (const [id, record] of snapshot) this.records.set(id, record);
      throw error;
    }
  }
}

export const demoRoadmapRepository = new DemoRoadmapRepository();
