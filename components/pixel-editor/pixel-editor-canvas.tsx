"use client";

import { useEffect, useMemo, useRef } from "react";

type PixelEditorCanvasProps = {
  gridSize: number;
  cellSize: number;
  showGrid: boolean;
  hideEmptyPixels: boolean;
  readOnly: boolean;
  activeColor: string;
  palette: readonly string[];
  selected: ReadonlySet<string>;
  pixelColors: ReadonlyMap<string, string>;
  onRequestPaintMode: (id: string, button: number) => void;
  onSelectColor: (color: string) => void;
  onPixelPointerDown: (id: string, button: number) => void;
  onPixelPointerMove: (id: string, buttons: number) => void;
  onPointerEnd: () => void;
  onSpaceSelectStart: () => void;
  onSpaceSelectEnd: () => void;
};

function toPixelId(x: number, y: number) {
  return `${x},${y}`;
}

export function PixelEditorCanvas({
  gridSize,
  cellSize,
  showGrid,
  hideEmptyPixels,
  readOnly,
  activeColor,
  palette,
  selected,
  pixelColors,
  onRequestPaintMode,
  onSelectColor,
  onPixelPointerDown,
  onPixelPointerMove,
  onPointerEnd,
  onSpaceSelectStart,
  onSpaceSelectEnd
}: PixelEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSize = useMemo(() => gridSize * cellSize, [gridSize, cellSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const id = toPixelId(x, y);
        const isPainted = pixelColors.has(id);
        const color = isPainted ? pixelColors.get(id) ?? "#ffffff" : hideEmptyPixels ? "transparent" : "#ffffff";
        const left = x * cellSize;
        const top = y * cellSize;

        ctx.fillStyle = color;
        ctx.fillRect(left, top, cellSize, cellSize);

        const isSelected = selected.has(id);

        if (isSelected) {
          ctx.strokeStyle = "#111111";
          ctx.lineWidth = 2;
          ctx.strokeRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
        } else if (isPainted) {
          // Painted cells keep a persistent visual boundary.
          ctx.strokeStyle = "#0f766e";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
        } else if (showGrid) {
          ctx.strokeStyle = "#d4d4d8";
          ctx.lineWidth = 1;
          ctx.strokeRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [cellSize, gridSize, hideEmptyPixels, pixelColors, selected, showGrid]);

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

  const getPixelFromEvent = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);

    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
      return null;
    }

    return toPixelId(x, y);
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelectColor(color)}
            aria-label={`color-${color}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: activeColor === color ? "2px solid #111" : "1px solid #ccc",
              backgroundColor: color,
              cursor: "pointer"
            }}
          />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ border: "1px solid #d4d4d8", borderRadius: 8, cursor: readOnly ? "pointer" : "crosshair" }}
        onContextMenu={(event) => event.preventDefault()}
        onMouseDown={(event) => {
          const id = getPixelFromEvent(event);
          if (!id) return;

          if (readOnly) {
            onRequestPaintMode(id, event.button);
            return;
          }
          onPixelPointerDown(id, event.button);
        }}
        onMouseMove={(event) => {
          if (readOnly) return;
          const id = getPixelFromEvent(event);
          if (!id) return;
          onPixelPointerMove(id, event.buttons);
        }}
        onMouseUp={onPointerEnd}
        onMouseLeave={() => {
          onPointerEnd();
          onSpaceSelectEnd();
        }}
      />
    </section>
  );
}
