"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewState } from "@vis.gl/react-maplibre";
import { MapChunkOverlay } from "@/components/pixel-editor/map-chunk-overlay";
import {
  lngLatBoundsToPixelBounds,
  type LngLatBounds,
  type PixelBounds
} from "@/features/pixel-editor/map-pixel-coordinate";
import { usePixelEditorCore } from "@/features/pixel-editor/use-pixel-editor-core";
import { getVisibleChunks } from "@/features/pixel-editor/viewport";

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

const PIXEL_VIEW_ZOOM_THRESHOLD = 9.5;
const PIXEL_PAINT_ZOOM_THRESHOLD = 13;
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
  const [isModePanelOpen, setIsModePanelOpen] = useState(false);
  const [mapViewState, setMapViewState] = useState<ViewState>(INITIAL_MAP_VIEW_STATE);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const zoomAnimationRef = useRef<number | null>(null);
  const canViewPixelLayer = mapViewState.zoom >= PIXEL_VIEW_ZOOM_THRESHOLD;
  const canPaintPixelLayer = mapViewState.zoom >= PIXEL_PAINT_ZOOM_THRESHOLD;

  const mapPixelBounds = useMemo(() => {
    if (!mapBounds) return null;
    return lngLatBoundsToPixelBounds(mapBounds);
  }, [mapBounds]);
  const canRenderChunkOverlay = canViewPixelLayer && mapBounds !== null && mapPixelBounds !== null;
  const visibleChunks = useMemo(() => {
    if (!mapPixelBounds) return [];
    return getVisibleChunks(pixelBoundsToViewportBounds(mapPixelBounds));
  }, [mapPixelBounds]);

  useEffect(() => {
    if (!canPaintPixelLayer) {
      setIsPaintMode(false);
    }
  }, [canPaintPixelLayer]);

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
        showOverlay={canRenderChunkOverlay}
        overlayHint={`Zoom above ${PIXEL_VIEW_ZOOM_THRESHOLD.toFixed(2)}`}
        onMapClick={() => setIsModePanelOpen(true)}
        controls={
          <>
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

            {isModePanelOpen ? (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 24,
                  display: "inline-flex",
                  gap: 4,
                  padding: 4,
                  borderRadius: 999,
                  backgroundColor: "rgba(248, 250, 252, 0.9)",
                  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
                  transform: "translateX(-50%)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsPaintMode(false)}
                  style={{
                    ...modeButtonStyle,
                    backgroundColor: isPaintMode ? "transparent" : "#111827",
                    color: isPaintMode ? "#334155" : "#ffffff"
                  }}
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!canPaintPixelLayer) return;
                    setIsPaintMode(true);
                  }}
                  style={{
                    ...modeButtonStyle,
                    backgroundColor: isPaintMode ? "#111827" : "transparent",
                    color: canPaintPixelLayer ? (isPaintMode ? "#ffffff" : "#334155") : "#94a3b8",
                    cursor: canPaintPixelLayer ? "pointer" : "not-allowed"
                  }}
                >
                  Paint
                </button>
              </div>
            ) : null}
          </>
        }
        overlay={(projection) =>
          mapBounds && mapPixelBounds ? (
            <MapChunkOverlay
              projection={projection}
              zoom={mapViewState.zoom}
              visibleChunks={visibleChunks}
              showGrid={isPaintMode && canPaintPixelLayer}
              hideEmptyPixels={!isPaintMode}
              readOnly={!isPaintMode || !canPaintPixelLayer}
              selected={core.selected}
              pixelColors={core.pixelColors}
              onRequestPaintMode={(id, button) => {
                setIsPaintMode(true);
                core.onPixelMouseDown(id, button);
              }}
              onPixelPointerDown={core.onPixelMouseDown}
              onPixelPointerMove={core.onPixelMouseEnter}
              onPointerEnd={core.onPointerEnd}
              onSpaceSelectStart={core.onSpaceSelectStart}
              onSpaceSelectEnd={core.onSpaceSelectEnd}
              onWheelZoom={updateMapZoom}
            />
          ) : null
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

const modeButtonStyle = {
  minWidth: 72,
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 14
} as const;
