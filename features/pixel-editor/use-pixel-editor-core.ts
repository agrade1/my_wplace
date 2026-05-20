"use client";

import { useState } from "react";

const DEFAULT_PALETTE = [
  "#111111",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ffffff"
] as const;

export function usePixelEditorCore() {
  const [activeColor, setActiveColor] = useState<string>(DEFAULT_PALETTE[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pixelColors, setPixelColors] = useState<Map<string, string>>(new Map());
  const [isDragging, setIsDragging] = useState(false);

  const onSelectColor = (color: string) => {
    setActiveColor(color);
  };

  const onPixelMouseDown = (id: string, button: number) => {
    // TODO(core): right-click deselect and space-drag multi-select rules.
    if (button === 2) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    setSelected(new Set([id]));
    setIsDragging(true);
  };

  const onPixelMouseEnter = (id: string) => {
    if (!isDragging) return;

    // TODO(core): replace with space-drag multi-select semantics.
    setSelected((prev) => new Set(prev).add(id));
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const applyColorToSelection = () => {
    if (selected.size === 0) return;

    setPixelColors((prev) => {
      const next = new Map(prev);
      selected.forEach((id) => {
        next.set(id, activeColor);
      });
      return next;
    });
  };

  return {
    palette: DEFAULT_PALETTE,
    activeColor,
    selected,
    pixelColors,
    onSelectColor,
    onPixelMouseDown,
    onPixelMouseEnter,
    onMouseUp,
    applyColorToSelection
  };
}
