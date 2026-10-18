import type { RoadmapOwner, RoadmapRepository } from "@/lib/server/repositories/roadmap-repository";
import { ApiError } from "@/lib/server/validation/errors";

export async function searchRepository(repository: RoadmapRepository, query: { search?: string; sort?: "popular" | "recent" }) {
  if (query.search && query.search.length > 160) throw new ApiError("VALIDATION_ERROR", "Search query is too long", 400);
  return repository.list(query);
}

export async function addRoadmapToShelf(repository: RoadmapRepository, sourceId: string, owner: RoadmapOwner) {
  if (!sourceId || sourceId.length > 100) throw new ApiError("VALIDATION_ERROR", "Invalid roadmap source ID", 400);
  await repository.addToShelf(sourceId, owner);
}

export async function removeRoadmapFromShelf(repository: RoadmapRepository, sourceId: string, owner: RoadmapOwner) {
  await repository.removeFromShelf(sourceId, owner);
}

export async function toggleRoadmapLike(repository: RoadmapRepository, id: string, owner: RoadmapOwner) {
  await repository.toggleLike(id, owner);
}
