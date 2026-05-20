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
  const [isSpaceSelecting, setIsSpaceSelecting] = useState(false);
  const [isRightDragging, setIsRightDragging] = useState(false);

  const onSelectColor = (color: string) => {
    setActiveColor(color);
  };

  const paintPixel = (id: string) => {
    setPixelColors((prev) => {
      const next = new Map(prev);
      next.set(id, activeColor);
      return next;
    });
  };

  const clearPixel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setPixelColors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const onPixelMouseDown = (id: string, button: number) => {
    // Right-click removes the cell from the current selection.
    if (button === 2) {
      setIsRightDragging(true);
      clearPixel(id);
      return;
    }

    if (button !== 0) return;

    // Left-click keeps previous selection and adds only the clicked cell.
    setSelected((prev) => new Set(prev).add(id));
    paintPixel(id);
  };

  const onPixelMouseEnter = (id: string, buttons: number) => {
    const isRightButtonPressed = (buttons & 2) === 2;

    if (isRightDragging && isRightButtonPressed) {
      clearPixel(id);
      return;
    }

    if (!isSpaceSelecting) return;

    setSelected((prev) => new Set(prev).add(id));
    paintPixel(id);
  };

  const onPointerEnd = () => {
    setIsRightDragging(false);
  };

  const onSpaceSelectStart = () => {
    setIsSpaceSelecting(true);
  };

  const onSpaceSelectEnd = () => {
    setIsSpaceSelecting(false);
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
    onPointerEnd,
    onSpaceSelectStart,
    onSpaceSelectEnd,
    applyColorToSelection
  };
}
