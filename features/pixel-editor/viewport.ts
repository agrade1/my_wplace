import { PIXEL_CHUNK_SIZE } from "@/features/pixel-editor/pixel-storage";

export type ViewportBounds = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type ChunkCoordinate = {
  chunkX: number;
  chunkY: number;
};

export function getViewportBounds(centerX: number, centerY: number, width: number, height: number): ViewportBounds {
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);

  const startX = Math.max(0, centerX - halfWidth);
  const startY = Math.max(0, centerY - halfHeight);

  return {
    startX,
    startY,
    endX: startX + width - 1,
    endY: startY + height - 1
  };
}

export function getCenterChunk(centerX: number, centerY: number): ChunkCoordinate {
  return {
    chunkX: Math.floor(centerX / PIXEL_CHUNK_SIZE),
    chunkY: Math.floor(centerY / PIXEL_CHUNK_SIZE)
  };
}

export function getVisibleChunks(bounds: ViewportBounds): ChunkCoordinate[] {
  const startChunkX = Math.floor(bounds.startX / PIXEL_CHUNK_SIZE);
  const startChunkY = Math.floor(bounds.startY / PIXEL_CHUNK_SIZE);
  const endChunkX = Math.floor(bounds.endX / PIXEL_CHUNK_SIZE);
  const endChunkY = Math.floor(bounds.endY / PIXEL_CHUNK_SIZE);
  const visibleChunks: ChunkCoordinate[] = [];

  for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY += 1) {
    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX += 1) {
      visibleChunks.push({ chunkX, chunkY });
    }
  }

  return visibleChunks;
}
