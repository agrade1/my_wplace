"use client";

import { useState } from "react";
import { PixelEditorCanvas } from "@/components/pixel-editor/pixel-editor-canvas";
import { usePixelEditorCore } from "@/features/pixel-editor/use-pixel-editor-core";

export default function Home() {
  const core = usePixelEditorCore();
  const [isPaintMode, setIsPaintMode] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        gap: 20,
        background:
          "linear-gradient(180deg, #f6f7f1 0%, #eef1e5 100%)"
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Pixel Layer</h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              {isPaintMode ? "Paint mode" : "View mode"}
            </p>
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
              onClick={() => setIsPaintMode(true)}
              style={{
                border: 0,
                borderRadius: 6,
                padding: "10px 14px",
                backgroundColor: isPaintMode ? "#111827" : "transparent",
                color: isPaintMode ? "#ffffff" : "#334155",
                cursor: "pointer"
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#334155" }}>
            <span>Painted cells: {core.pixelColors.size}</span>
            <span>Selected cells: {core.selected.size}</span>
          </div>

          <div style={{ color: "#475569" }}>
            {isPaintMode ? "Grid visible" : "Click canvas to enter paint mode"}
          </div>
        </div>

        <PixelEditorCanvas
          gridSize={32}
          cellSize={16}
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
      </section>
    </main>
  );
}
