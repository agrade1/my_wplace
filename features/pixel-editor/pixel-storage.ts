export const PIXEL_CHUNK_SIZE = 40;

export type PixelColorMap = Map<string, string>;

export type PaintedPixelInsert = {
  region_id: string;
  pixel_x: number;
  pixel_y: number;
  color: string;
  updated_by?: string | null;
};

export type PaintedPixelRow = PaintedPixelInsert & {
  chunk_x: number;
  chunk_y: number;
  updated_at?: string;
};

export function toPixelId(pixelX: number, pixelY: number) {
  return `${pixelX},${pixelY}`;
}

export function parsePixelId(pixelId: string) {
  const [pixelX, pixelY] = pixelId.split(",");

  if (pixelX === undefined || pixelY === undefined) {
    throw new Error(`Invalid pixel id: ${pixelId}`);
  }

  const parsedX = Number(pixelX);
  const parsedY = Number(pixelY);

  if (!Number.isInteger(parsedX) || !Number.isInteger(parsedY)) {
    throw new Error(`Invalid pixel id: ${pixelId}`);
  }

  return {
    pixelX: parsedX,
    pixelY: parsedY
  };
}

export function toChunkCoordinate(pixelCoordinate: number) {
  return Math.floor(pixelCoordinate / PIXEL_CHUNK_SIZE);
}

export function toPaintedPixelInserts(
  pixelColors: ReadonlyMap<string, string>,
  regionId: string,
  updatedBy?: string | null
) {
  return Array.from(pixelColors.entries()).map(([pixelId, color]) => {
    const { pixelX, pixelY } = parsePixelId(pixelId);

    return {
      region_id: regionId,
      pixel_x: pixelX,
      pixel_y: pixelY,
      color,
      updated_by: updatedBy ?? null
    };
  });
}

export function rowsToPixelColorMap(rows: ReadonlyArray<Pick<PaintedPixelRow, "pixel_x" | "pixel_y" | "color">>) {
  const pixelColors: PixelColorMap = new Map();

  rows.forEach((row) => {
    pixelColors.set(toPixelId(row.pixel_x, row.pixel_y), row.color);
  });

  return pixelColors;
}

export function rowToPixelId(row: Pick<PaintedPixelRow, "pixel_x" | "pixel_y">) {
  return toPixelId(row.pixel_x, row.pixel_y);
}
