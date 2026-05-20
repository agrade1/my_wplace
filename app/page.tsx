"use client";

import { PixelEditorCanvas } from "@/components/pixel-editor/pixel-editor-canvas";
import { usePixelEditorCore } from "@/features/pixel-editor/use-pixel-editor-core";

export default function Home() {
  const core = usePixelEditorCore();

  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0 }}>Pixel Editor Core</h1>
        <p style={{ marginTop: 8, color: "#555" }}>
          Implement core logic in <code>use-pixel-editor-core.ts</code>.
        </p>
      </header>

      <span>Selected pixels: {core.selected.size}</span>

      <PixelEditorCanvas
        gridSize={32}
        cellSize={16}
        palette={core.palette}
        activeColor={core.activeColor}
        selected={core.selected}
        pixelColors={core.pixelColors}
        onSelectColor={core.onSelectColor}
        onPixelPointerDown={core.onPixelMouseDown}
        onPixelPointerMove={core.onPixelMouseEnter}
        onPointerEnd={core.onPointerEnd}
        onSpaceSelectStart={core.onSpaceSelectStart}
        onSpaceSelectEnd={core.onSpaceSelectEnd}
      />
    </main>
  );
}
