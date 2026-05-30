"use client";

import { useEffect, useRef } from "react";
import {
  getPixelCellScreenSize,
  pixelCoordinateToScreenRect,
  screenPointToPixelCoordinate,
  type LngLatBounds
} from "@/features/pixel-editor/map-pixel-coordinate";
import { parsePixelId, PIXEL_CHUNK_SIZE, toPixelId } from "@/features/pixel-editor/pixel-storage";
import type { ChunkCoordinate } from "@/features/pixel-editor/viewport";

type MapChunkOverlayProps = {
  mapBounds: LngLatBounds;
  zoom: number;
  visibleChunks: ChunkCoordinate[];
  showGrid: boolean;
  hideEmptyPixels: boolean;
  readOnly: boolean;
  selected: ReadonlySet<string>;
  pixelColors: ReadonlyMap<string, string>;
  onRequestPaintMode: (id: string, button: number) => void;
  onPixelPointerDown: (id: string, button: number) => void;
  onPixelPointerMove: (id: string, buttons: number) => void;
  onPointerEnd: () => void;
  onSpaceSelectStart: () => void;
  onSpaceSelectEnd: () => void;
  onWheelZoom: (delta: number) => void;
};

/**
 * 지도 viewport 위에 현재 보이는 청크 캔버스들을 배치합니다.
 *
 * 각 청크는 40x40 셀을 담당하고, 클릭/드래그 입력은 wrapper에서 전역 픽셀 좌표로 변환합니다.
 */
export function MapChunkOverlay({
  mapBounds,
  zoom,
  visibleChunks,
  showGrid,
  hideEmptyPixels,
  readOnly,
  selected,
  pixelColors,
  onRequestPaintMode,
  onPixelPointerDown,
  onPixelPointerMove,
  onPointerEnd,
  onSpaceSelectStart,
  onSpaceSelectEnd,
  onWheelZoom
}: MapChunkOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      onSpaceSelectStart();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      onSpaceSelectEnd();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onSpaceSelectEnd, onSpaceSelectStart]);

  const getPixelIdFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    const coordinate = screenPointToPixelCoordinate(
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      mapBounds,
      zoom
    );

    return toPixelId(coordinate.pixelX, coordinate.pixelY);
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: readOnly ? "pointer" : "crosshair"
      }}
      onWheel={(event) => {
        event.preventDefault();
        onWheelZoom(event.deltaY < 0 ? 1 : -1);
      }}
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={(event) => {
        const id = getPixelIdFromEvent(event);
        if (!id) return;

        if (readOnly) {
          onRequestPaintMode(id, event.button);
          return;
        }

        onPixelPointerDown(id, event.button);
      }}
      onMouseMove={(event) => {
        if (readOnly) return;
        const id = getPixelIdFromEvent(event);
        if (!id) return;
        onPixelPointerMove(id, event.buttons);
      }}
      onMouseUp={onPointerEnd}
      onMouseLeave={() => {
        onPointerEnd();
        onSpaceSelectEnd();
      }}
    >
      {visibleChunks.map((chunk) => (
        <ChunkCanvas
          key={`${chunk.chunkX},${chunk.chunkY}`}
          chunk={chunk}
          mapBounds={mapBounds}
          zoom={zoom}
          showGrid={showGrid}
          hideEmptyPixels={hideEmptyPixels}
          selected={selected}
          pixelColors={pixelColors}
        />
      ))}
    </div>
  );
}

type ChunkCanvasProps = {
  chunk: ChunkCoordinate;
  mapBounds: LngLatBounds;
  zoom: number;
  showGrid: boolean;
  hideEmptyPixels: boolean;
  selected: ReadonlySet<string>;
  pixelColors: ReadonlyMap<string, string>;
};

function ChunkCanvas({ chunk, mapBounds, zoom, showGrid, hideEmptyPixels, selected, pixelColors }: ChunkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellSize = getPixelCellScreenSize(zoom);
  const chunkStartX = chunk.chunkX * PIXEL_CHUNK_SIZE;
  const chunkStartY = chunk.chunkY * PIXEL_CHUNK_SIZE;
  const chunkRect = pixelCoordinateToScreenRect({ pixelX: chunkStartX, pixelY: chunkStartY }, mapBounds, zoom);
  const chunkSize = cellSize * PIXEL_CHUNK_SIZE;
  const canvasSize = Math.max(1, Math.ceil(chunkSize));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hideEmptyPixels) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (showGrid && cellSize >= 4) {
      drawChunkGrid(ctx, cellSize, canvas.width, canvas.height);
    }

    pixelColors.forEach((color, pixelId) => {
      const { pixelX, pixelY } = parsePixelId(pixelId);
      if (!isPixelInsideChunk(pixelX, pixelY, chunkStartX, chunkStartY)) return;

      const localX = (pixelX - chunkStartX) * cellSize;
      const localY = (pixelY - chunkStartY) * cellSize;

      ctx.fillStyle = color;
      ctx.fillRect(localX, localY, cellSize, cellSize);

      ctx.strokeStyle = selected.has(pixelId) ? "#111111" : "#0f766e";
      ctx.lineWidth = selected.has(pixelId) ? 2 : 1.5;
      ctx.strokeRect(localX + 1, localY + 1, Math.max(0, cellSize - 2), Math.max(0, cellSize - 2));
    });
  }, [cellSize, chunkStartX, chunkStartY, hideEmptyPixels, pixelColors, selected, showGrid]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        position: "absolute",
        left: chunkRect.x,
        top: chunkRect.y,
        width: chunkSize,
        height: chunkSize,
        pointerEvents: "none"
      }}
    />
  );
}

function drawChunkGrid(ctx: CanvasRenderingContext2D, cellSize: number, width: number, height: number) {
  ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
  ctx.lineWidth = 1;

  for (let index = 0; index <= PIXEL_CHUNK_SIZE; index += 1) {
    const offset = index * cellSize;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(width, offset);
    ctx.stroke();
  }
}

function isPixelInsideChunk(pixelX: number, pixelY: number, chunkStartX: number, chunkStartY: number) {
  return (
    pixelX >= chunkStartX &&
    pixelX < chunkStartX + PIXEL_CHUNK_SIZE &&
    pixelY >= chunkStartY &&
    pixelY < chunkStartY + PIXEL_CHUNK_SIZE
  );
}
