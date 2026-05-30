"use client";

import { useEffect, useRef } from "react";
import type { MapProjection } from "@/components/map/korea-map-stage";
import {
  getPixelCellScreenSize,
  lngLatToPixelCoordinate,
  pixelCoordinateToLngLatCorner
} from "@/features/pixel-editor/map-pixel-coordinate";
import { parsePixelId, PIXEL_CHUNK_SIZE, toPixelId } from "@/features/pixel-editor/pixel-storage";
import type { ChunkCoordinate } from "@/features/pixel-editor/viewport";

type MapChunkOverlayProps = {
  projection: MapProjection;
  zoom: number;
  visibleChunks: ChunkCoordinate[];
  showGrid: boolean;
  hideEmptyPixels: boolean;
  readOnly: boolean;
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
  projection,
  zoom,
  visibleChunks,
  showGrid,
  hideEmptyPixels,
  readOnly,
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
    const lngLat = projection.unprojectScreenPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    if (!lngLat) return null;

    const coordinate = lngLatToPixelCoordinate(lngLat);

    return toPixelId(coordinate.pixelX, coordinate.pixelY);
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: readOnly ? "none" : "auto",
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
          projection={projection}
          zoom={zoom}
          showGrid={showGrid}
          hideEmptyPixels={hideEmptyPixels}
          readOnly={readOnly}
          pixelColors={pixelColors}
        />
      ))}
    </div>
  );
}

type ChunkCanvasProps = {
  chunk: ChunkCoordinate;
  projection: MapProjection;
  zoom: number;
  showGrid: boolean;
  hideEmptyPixels: boolean;
  readOnly: boolean;
  pixelColors: ReadonlyMap<string, string>;
};

function ChunkCanvas({
  chunk,
  projection,
  zoom,
  showGrid,
  hideEmptyPixels,
  readOnly,
  pixelColors
}: ChunkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellSize = getPixelCellScreenSize(zoom);
  const chunkStartX = chunk.chunkX * PIXEL_CHUNK_SIZE;
  const chunkStartY = chunk.chunkY * PIXEL_CHUNK_SIZE;
  const chunkTopLeft = projection.projectLngLat(pixelCoordinateToLngLatCorner({ pixelX: chunkStartX, pixelY: chunkStartY }));
  const chunkBottomRight = projection.projectLngLat(
    pixelCoordinateToLngLatCorner({
      pixelX: chunkStartX + PIXEL_CHUNK_SIZE,
      pixelY: chunkStartY + PIXEL_CHUNK_SIZE
    })
  );
  const chunkSize = cellSize * PIXEL_CHUNK_SIZE;
  const canvasSize = Math.max(1, Math.ceil(chunkSize));
  const left = chunkTopLeft?.x ?? 0;
  const top = chunkTopLeft?.y ?? 0;
  const width = chunkTopLeft && chunkBottomRight ? chunkBottomRight.x - chunkTopLeft.x : chunkSize;
  const height = chunkTopLeft && chunkBottomRight ? chunkBottomRight.y - chunkTopLeft.y : chunkSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hideEmptyPixels) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (!readOnly && showGrid && cellSize >= 4) {
      drawChunkGrid(ctx, cellSize, canvas.width, canvas.height);
    }

    pixelColors.forEach((color, pixelId) => {
      const { pixelX, pixelY } = parsePixelId(pixelId);
      if (!isPixelInsideChunk(pixelX, pixelY, chunkStartX, chunkStartY)) return;

      const localX = (pixelX - chunkStartX) * cellSize;
      const localY = (pixelY - chunkStartY) * cellSize;

      ctx.fillStyle = color;
      ctx.fillRect(localX, localY, cellSize, cellSize);
    });
  }, [cellSize, chunkStartX, chunkStartY, hideEmptyPixels, pixelColors, readOnly, showGrid]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
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
