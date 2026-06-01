"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapProjection } from "@/components/map/korea-map-stage";
import { lngLatToPixelCoordinate, pixelCoordinateToLngLatCorner } from "@/features/pixel-editor/map-pixel-coordinate";
import { parsePixelId, PIXEL_CHUNK_SIZE, toPixelId } from "@/features/pixel-editor/pixel-storage";
import type { ChunkCoordinate } from "@/features/pixel-editor/viewport";

type MapChunkOverlayProps = {
  projection: MapProjection;
  zoom: number;
  visibleChunks: ChunkCoordinate[];
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

type CanvasSize = {
  width: number;
  height: number;
};

/**
 * 지도 viewport 위에 단일 캔버스를 올리고, 현재 보이는 청크 데이터만 그립니다.
 *
 * 데이터 경계는 청크 단위로 유지하지만 렌더링은 하나의 캔버스에서 처리해 청크 사이 이음새를 줄입니다.
 */
export function MapChunkOverlay({
  projection,
  zoom,
  visibleChunks,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const visibleChunkKeys = useMemo(
    () => new Set(visibleChunks.map((chunk) => toChunkKey(chunk.chunkX, chunk.chunkY))),
    [visibleChunks]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;

      setCanvasSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height)
      });
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasSize.width * ratio);
    canvas.height = Math.floor(canvasSize.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (!hideEmptyPixels) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    drawPaintedPixels(ctx, projection, pixelColors, visibleChunkKeys);

  }, [
    canvasSize.height,
    canvasSize.width,
    hideEmptyPixels,
    pixelColors,
    projection,
    readOnly,
    visibleChunkKeys,
    visibleChunks,
    zoom
  ]);

  const getPixelIdFromEvent = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const lngLat = projection.unprojectScreenPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    if (!lngLat) return null;

    const coordinate = lngLatToPixelCoordinate(lngLat);

    return toPixelId(coordinate.pixelX, coordinate.pixelY);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
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
    />
  );
}

function drawPaintedPixels(
  ctx: CanvasRenderingContext2D,
  projection: MapProjection,
  pixelColors: ReadonlyMap<string, string>,
  visibleChunkKeys: ReadonlySet<string>
) {
  pixelColors.forEach((color, pixelId) => {
    const { pixelX, pixelY } = parsePixelId(pixelId);
    const chunkX = Math.floor(pixelX / PIXEL_CHUNK_SIZE);
    const chunkY = Math.floor(pixelY / PIXEL_CHUNK_SIZE);

    if (!visibleChunkKeys.has(toChunkKey(chunkX, chunkY))) return;

    const rect = getPixelScreenRect(projection, pixelX, pixelY);
    if (!rect) return;

    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  });
}

function getPixelScreenRect(projection: MapProjection, pixelX: number, pixelY: number) {
  const topLeft = projection.projectLngLat(pixelCoordinateToLngLatCorner({ pixelX, pixelY }));
  const bottomRight = projection.projectLngLat(pixelCoordinateToLngLatCorner({ pixelX: pixelX + 1, pixelY: pixelY + 1 }));

  if (!topLeft || !bottomRight) return null;

  return {
    x: Math.floor(topLeft.x),
    y: Math.floor(topLeft.y),
    width: Math.max(1, Math.ceil(bottomRight.x - topLeft.x)),
    height: Math.max(1, Math.ceil(bottomRight.y - topLeft.y))
  };
}

function toChunkKey(chunkX: number, chunkY: number) {
  return `${chunkX},${chunkY}`;
}
