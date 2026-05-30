"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewState } from "@vis.gl/react-maplibre";
import { PixelEditorCanvas } from "@/components/pixel-editor/pixel-editor-canvas";
import {
  lngLatBoundsToPixelBounds,
  type LngLatBounds,
  type PixelBounds
} from "@/features/pixel-editor/map-pixel-coordinate";
import { usePixelEditorCore } from "@/features/pixel-editor/use-pixel-editor-core";
import { getVisibleChunks, getViewportBounds } from "@/features/pixel-editor/viewport";

const KoreaMapStage = dynamic(
  () => import("@/components/map/korea-map-stage").then((module) => module.KoreaMapStage),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#dbe4d3",
          color: "#475569"
        }}
      >
        Loading map...
      </div>
    )
  }
);

const GRID_SIZE = 32;
const CELL_SIZE = 16;
const PIXEL_LAYER_ZOOM_THRESHOLD = 13;
const INITIAL_MAP_VIEW_STATE: ViewState = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 6.2,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 }
};

export default function Home() {
  const core = usePixelEditorCore();
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [centerCell] = useState({ x: 24, y: 24 });
  const [mapViewState, setMapViewState] = useState<ViewState>(INITIAL_MAP_VIEW_STATE);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const zoomAnimationRef = useRef<number | null>(null);
  const canShowPixelLayer = mapViewState.zoom > PIXEL_LAYER_ZOOM_THRESHOLD;

  const viewportBounds = useMemo(
    () => getViewportBounds(centerCell.x, centerCell.y, GRID_SIZE, GRID_SIZE),
    [centerCell.x, centerCell.y]
  );
  const mapPixelBounds = useMemo(() => {
    if (!mapBounds) return null;
    return lngLatBoundsToPixelBounds(mapBounds);
  }, [mapBounds]);
  const visibleChunks = useMemo(() => {
    if (!mapPixelBounds) return [];
    return getVisibleChunks(pixelBoundsToViewportBounds(mapPixelBounds));
  }, [mapPixelBounds]);
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current !== null) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  const updateMapZoom = (delta: number) => {
    if (zoomAnimationRef.current !== null) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }

    const startZoom = mapViewState.zoom;
    const targetZoom = Math.min(18, Math.max(5.4, Number((startZoom + delta).toFixed(2))));
    const durationMs = 220;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startTime) / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextZoom = Number((startZoom + (targetZoom - startZoom) * easedProgress).toFixed(3));

      setMapViewState((prev) => ({
        ...prev,
        zoom: nextZoom
      }));

      if (progress < 1) {
        zoomAnimationRef.current = requestAnimationFrame(animate);
        return;
      }

      zoomAnimationRef.current = null;
    };

    setMapViewState((prev) => ({
      ...prev,
      zoom: startZoom
    }));

    zoomAnimationRef.current = requestAnimationFrame(animate);
  };

  return (
    <main style={{ minHeight: "100dvh", margin: 0, overflow: "hidden" }}>
      <KoreaMapStage
        viewState={mapViewState}
        onMove={setMapViewState}
        onBoundsChange={setMapBounds}
        showOverlay={canShowPixelLayer}
        overlayHint={`Zoom above ${PIXEL_LAYER_ZOOM_THRESHOLD.toFixed(2)}`}
        controls={
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              display: "grid",
              overflow: "hidden",
              borderRadius: 8,
              backgroundColor: "rgba(248, 250, 252, 0.86)",
              boxShadow: "0 14px 36px rgba(15, 23, 42, 0.16)",
              backdropFilter: "blur(10px)"
            }}
          >
            <button
              type="button"
              onClick={() => updateMapZoom(1)}
              aria-label="Zoom in"
              style={zoomButtonStyle}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => updateMapZoom(-1)}
              aria-label="Zoom out"
              style={{ ...zoomButtonStyle, borderTop: "1px solid rgba(148, 163, 184, 0.32)" }}
            >
              -
            </button>
          </div>
        }
        overlay={
          <PixelEditorCanvas
            gridSize={GRID_SIZE}
            cellSize={CELL_SIZE}
            viewportStartX={viewportBounds.startX}
            viewportStartY={viewportBounds.startY}
            showGrid={isPaintMode}
            hideEmptyPixels={!isPaintMode}
            readOnly={!isPaintMode}
            palette={core.palette}
            activeColor={core.activeColor}
            selected={core.selected}
            pixelColors={core.pixelColors}
            onRequestPaintMode={(id, button) => {
              setIsPaintMode(true);
              core.onPixelMouseDown(id, button);
            }}
            onSelectColor={core.onSelectColor}
            onPixelPointerDown={core.onPixelMouseDown}
            onPixelPointerMove={core.onPixelMouseEnter}
            onPointerEnd={core.onPointerEnd}
            onSpaceSelectStart={core.onSpaceSelectStart}
            onSpaceSelectEnd={core.onSpaceSelectEnd}
          />
        }
      />
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          maxWidth: 360,
          padding: "10px 12px",
          borderRadius: 8,
          backgroundColor: "rgba(248, 250, 252, 0.86)",
          color: "#334155",
          fontSize: 12,
          lineHeight: 1.5,
          boxShadow: "0 14px 36px rgba(15, 23, 42, 0.14)",
          backdropFilter: "blur(10px)"
        }}
      >
        {mapPixelBounds ? (
          <>
            <div>
              pixels {mapPixelBounds.startX},{mapPixelBounds.startY} to {mapPixelBounds.endX},{mapPixelBounds.endY}
            </div>
            <div>chunks {visibleChunks.map(({ chunkX, chunkY }) => `(${chunkX},${chunkY})`).join(", ")}</div>
          </>
        ) : (
          "loading viewport"
        )}
      </div>
    </main>
  );
}

function pixelBoundsToViewportBounds(bounds: PixelBounds) {
  return {
    startX: bounds.startX,
    startY: bounds.startY,
    endX: bounds.endX,
    endY: bounds.endY
  };
}

const zoomButtonStyle = {
  width: 38,
  height: 38,
  border: 0,
  backgroundColor: "transparent",
  color: "#111827",
  cursor: "pointer",
  fontSize: 22,
  lineHeight: 1
} as const;
