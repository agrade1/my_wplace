"use client";

import { useEffect, useMemo, useRef } from "react";

type PixelEditorCanvasProps = {
  gridSize: number;
  cellSize: number;
  activeColor: string;
  palette: readonly string[];
  selected: ReadonlySet<string>;
  pixelColors: ReadonlyMap<string, string>;
  onSelectColor: (color: string) => void;
  onPixelPointerDown: (id: string, button: number) => void;
  onPixelPointerMove: (id: string) => void;
  onPointerUp: () => void;
};

function toPixelId(x: number, y: number) {
  return `${x},${y}`;
}

export function PixelEditorCanvas({
  gridSize,
  cellSize,
  activeColor,
  palette,
  selected,
  pixelColors,
  onSelectColor,
  onPixelPointerDown,
  onPixelPointerMove,
  onPointerUp
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
        const color = pixelColors.get(id) ?? "#ffffff";
        const left = x * cellSize;
        const top = y * cellSize;

        ctx.fillStyle = color;
        ctx.fillRect(left, top, cellSize, cellSize);

        if (selected.has(id)) {
          ctx.strokeStyle = "#111111";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "#d4d4d8";
          ctx.lineWidth = 1;
        }

        ctx.strokeRect(left + 0.5, top + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }, [cellSize, gridSize, pixelColors, selected]);

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
        style={{ border: "1px solid #d4d4d8", borderRadius: 8, cursor: "crosshair" }}
        onContextMenu={(event) => event.preventDefault()}
        onMouseDown={(event) => {
          const id = getPixelFromEvent(event);
          if (!id) return;
          onPixelPointerDown(id, event.button);
        }}
        onMouseMove={(event) => {
          const id = getPixelFromEvent(event);
          if (!id) return;
          onPixelPointerMove(id);
        }}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
      />
    </section>
  );
}
