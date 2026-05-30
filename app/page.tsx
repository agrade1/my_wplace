"use client";

import { useEffect, useMemo, useState } from "react";
import { PixelEditorCanvas } from "@/components/pixel-editor/pixel-editor-canvas";
import { usePixelEditorCore } from "@/features/pixel-editor/use-pixel-editor-core";
import { getCenterChunk, getViewportBounds, getVisibleChunks } from "@/features/pixel-editor/viewport";

const GRID_SIZE = 32;
const CELL_SIZE = 16;
const PAN_STEP = 8;

export default function Home() {
  const core = usePixelEditorCore();
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3);
  const [centerCell, setCenterCell] = useState({ x: 24, y: 24 });
  const canShowPixelLayer = zoomLevel > 3;

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      setZoomLevel((prev) => {
        const delta = event.deltaY < 0 ? 0.25 : -0.25;
        return Math.min(6, Math.max(1, Number((prev + delta).toFixed(2))));
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const viewportBounds = useMemo(
    () => getViewportBounds(centerCell.x, centerCell.y, GRID_SIZE, GRID_SIZE),
    [centerCell.x, centerCell.y]
  );
  const centerChunk = useMemo(() => getCenterChunk(centerCell.x, centerCell.y), [centerCell.x, centerCell.y]);
  const visibleChunks = useMemo(() => getVisibleChunks(viewportBounds), [viewportBounds]);

  const moveViewport = (deltaX: number, deltaY: number) => {
    setCenterCell((prev) => ({
      x: Math.max(0, prev.x + deltaX),
      y: Math.max(0, prev.y + deltaY)
    }));
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        gap: 20,
        background: "linear-gradient(180deg, #f6f7f1 0%, #eef1e5 100%)"
      }}
    >
      <header style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Pixel Layer</h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              {canShowPixelLayer ? (isPaintMode ? "Paint mode" : "View mode") : "Zoom in to reveal pixels"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", color: "#334155" }}>
            <span>Zoom</span>
            <strong>{zoomLevel.toFixed(2)}</strong>
          </div>

          <div
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 8,
              backgroundColor: "#dce4cc",
              gap: 4
            }}
          >
            <button
              type="button"
              onClick={() => setIsPaintMode(false)}
              style={{
                border: 0,
                borderRadius: 6,
                padding: "10px 14px",
                backgroundColor: isPaintMode ? "transparent" : "#111827",
                color: isPaintMode ? "#334155" : "#ffffff",
                cursor: "pointer"
              }}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canShowPixelLayer) return;
                setIsPaintMode(true);
              }}
              style={{
                border: 0,
                borderRadius: 6,
                padding: "10px 14px",
                backgroundColor: isPaintMode ? "#111827" : "transparent",
                color: canShowPixelLayer ? (isPaintMode ? "#ffffff" : "#334155") : "#94a3b8",
                cursor: canShowPixelLayer ? "pointer" : "not-allowed"
              }}
            >
              Paint
            </button>
          </div>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gap: 16,
          padding: 20,
          backgroundColor: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(148, 163, 184, 0.28)",
          borderRadius: 8
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#334155" }}>
              <span>Painted cells: {core.pixelColors.size}</span>
              <span>Selected cells: {core.selected.size}</span>
              <span>Center cell: {centerCell.x}, {centerCell.y}</span>
              <span>Center chunk: {centerChunk.chunkX}, {centerChunk.chunkY}</span>
            </div>

            <div style={{ color: "#475569" }}>
              {canShowPixelLayer ? (isPaintMode ? "Grid visible" : "Click canvas to enter paint mode") : "Pixel layer hidden below zoom 3"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", color: "#475569" }}>
            <span>
              Viewport cells: {viewportBounds.startX},{viewportBounds.startY} to {viewportBounds.endX},{viewportBounds.endY}
            </span>
            <span>
              Visible chunks: {visibleChunks.map(({ chunkX, chunkY }) => `(${chunkX},${chunkY})`).join(", ")}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => moveViewport(0, -PAN_STEP)} style={panButtonStyle}>
              Pan Up
            </button>
            <button type="button" onClick={() => moveViewport(-PAN_STEP, 0)} style={panButtonStyle}>
              Pan Left
            </button>
            <button type="button" onClick={() => moveViewport(PAN_STEP, 0)} style={panButtonStyle}>
              Pan Right
            </button>
            <button type="button" onClick={() => moveViewport(0, PAN_STEP)} style={panButtonStyle}>
              Pan Down
            </button>
          </div>
        </div>

        {canShowPixelLayer ? (
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
        ) : (
          <div
            style={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
              borderRadius: 8,
              border: "1px dashed rgba(100, 116, 139, 0.45)",
              color: "#64748b",
              backgroundColor: "rgba(255,255,255,0.44)"
            }}
          >
            Zoom above 3.00 to render the pixel layer
          </div>
        )}
      </section>
    </main>
  );
}

const panButtonStyle = {
  border: 0,
  borderRadius: 6,
  padding: "10px 14px",
  backgroundColor: "#dce4cc",
  color: "#1f2937",
  cursor: "pointer"
} as const;
