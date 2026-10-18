import type { RoadmapRepository, RoadmapOwner, StoredRoadmap } from "./roadmap-repository";

/** Demo-only adapter. This is process memory, not production persistence. */
export class DemoRoadmapRepository implements RoadmapRepository {
  private readonly records = new Map<string, StoredRoadmap>();
  private readonly shelves = new Map<string, Set<string>>();
  private readonly likes = new Map<string, Set<string>>();

  async list(query: { search?: string; sort?: "popular" | "recent" }) {
    const search = query.search?.toLocaleLowerCase();
    return [...this.records.values()]
      .filter((record) => !search || record.projectTitle.toLocaleLowerCase().includes(search))
      .sort((a, b) => query.sort === "recent" ? b.createdAt.getTime() - a.createdAt.getTime() : a.projectTitle.localeCompare(b.projectTitle))
      .map((record) => structuredClone(record));
  }

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

  async addToShelf(sourceId: string, owner: RoadmapOwner) {
    const shelf = this.shelves.get(owner.userId) ?? new Set<string>();
    shelf.add(sourceId);
    this.shelves.set(owner.userId, shelf);
  }

  async removeFromShelf(sourceId: string, owner: RoadmapOwner) {
    this.shelves.get(owner.userId)?.delete(sourceId);
  }

  async toggleLike(id: string, owner: RoadmapOwner) {
    if (!this.records.has(id)) throw new Error("Roadmap not found");
    const likes = this.likes.get(id) ?? new Set<string>();
    if (likes.has(owner.userId)) likes.delete(owner.userId); else likes.add(owner.userId);
    this.likes.set(id, likes);
  }

  async transaction<T>(work: (repository: RoadmapRepository) => Promise<T>): Promise<T> {
    const snapshot = new Map([...this.records].map(([id, record]) => [id, structuredClone(record)]));
    const shelfSnapshot = new Map([...this.shelves].map(([id, values]) => [id, new Set(values)]));
    const likesSnapshot = new Map([...this.likes].map(([id, values]) => [id, new Set(values)]));
    try {
      return await work(this);
    } catch (error) {
      this.records.clear();
      for (const [id, record] of snapshot) this.records.set(id, record);
      this.shelves.clear();
      for (const [id, values] of shelfSnapshot) this.shelves.set(id, values);
      this.likes.clear();
      for (const [id, values] of likesSnapshot) this.likes.set(id, values);
      throw error;
    }
  }
}

export const demoRoadmapRepository = new DemoRoadmapRepository();
