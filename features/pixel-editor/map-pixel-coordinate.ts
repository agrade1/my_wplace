export type LngLatCoordinate = {
  lng: number;
  lat: number;
};

export type WorldPoint = {
  x: number;
  y: number;
};

export type PixelCoordinate = {
  pixelX: number;
  pixelY: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ScreenRect = ScreenPoint & {
  size: number;
};

export type LngLatBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type PixelBounds = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export const PIXEL_REFERENCE_ZOOM = 15;
export const PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM = 20;

const MERCATOR_TILE_SIZE = 256;
const MAX_MERCATOR_LATITUDE = 85.05112878;

/**
 * 위도/경도를 고정 Web Mercator 격자의 전역 픽셀 좌표로 변환합니다.
 *
 * 같은 지도 위치는 줌이나 화면 위치가 바뀌어도 항상 같은 픽셀 id로 저장되어야 합니다.
 * 그래서 현재 화면 줌이 아니라 기준 줌(`PIXEL_REFERENCE_ZOOM`)에서 좌표를 계산합니다.
 */
export function lngLatToPixelCoordinate(coordinate: LngLatCoordinate): PixelCoordinate {
  const point = lngLatToWorldPoint(coordinate, PIXEL_REFERENCE_ZOOM);

  return {
    pixelX: Math.floor(point.x / PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM),
    pixelY: Math.floor(point.y / PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM)
  };
}

/**
 * 전역 픽셀 좌표를 해당 셀의 중심 위도/경도로 되돌립니다.
 *
 * 셀의 좌상단이 아니라 중심점을 사용해야 지도 위에 다시 그릴 때 원래 칠한 위치 주변에 배치됩니다.
 */
export function pixelCoordinateToLngLat(coordinate: PixelCoordinate): LngLatCoordinate {
  return worldPointToLngLat(
    {
      x: (coordinate.pixelX + 0.5) * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM,
      y: (coordinate.pixelY + 0.5) * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM
    },
    PIXEL_REFERENCE_ZOOM
  );
}

/**
 * 전역 픽셀 좌표의 좌상단 모서리를 위도/경도로 변환합니다.
 *
 * 청크 캔버스를 지도 위에 배치할 때는 셀 중심이 아니라 모서리 좌표가 필요합니다.
 */
export function pixelCoordinateToLngLatCorner(coordinate: PixelCoordinate): LngLatCoordinate {
  return worldPointToLngLat(
    {
      x: coordinate.pixelX * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM,
      y: coordinate.pixelY * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM
    },
    PIXEL_REFERENCE_ZOOM
  );
}

/**
 * 현재 지도 줌에서 픽셀 셀 하나가 화면에 몇 px로 보여야 하는지 계산합니다.
 *
 * 기준 줌에서는 한 셀이 20px이고, 줌이 1 증가할 때마다 화면 크기는 2배가 됩니다.
 */
export function getPixelCellScreenSize(zoom: number) {
  return PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM * 2 ** (zoom - PIXEL_REFERENCE_ZOOM);
}

/**
 * 지도 화면의 마우스 위치를 전역 픽셀 좌표로 변환합니다.
 *
 * 현재 지도 viewport의 북서쪽을 화면 원점으로 보고, 화면 px 이동량을 기준 줌의 Web Mercator 좌표로 환산합니다.
 */
export function screenPointToPixelCoordinate(point: ScreenPoint, bounds: LngLatBounds, zoom: number): PixelCoordinate {
  const topLeftWorldPoint = lngLatToWorldPoint({ lng: bounds.west, lat: bounds.north }, zoom);
  const referenceScale = 2 ** (PIXEL_REFERENCE_ZOOM - zoom);
  const referenceWorldPoint = {
    x: (topLeftWorldPoint.x + point.x) * referenceScale,
    y: (topLeftWorldPoint.y + point.y) * referenceScale
  };

  return {
    pixelX: Math.floor(referenceWorldPoint.x / PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM),
    pixelY: Math.floor(referenceWorldPoint.y / PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM)
  };
}

/**
 * 전역 픽셀 좌표가 현재 지도 화면에서 차지하는 사각형 위치를 계산합니다.
 *
 * 청크 캔버스를 지도 위에 배치할 때, 청크의 시작 픽셀 좌표를 화면 좌표로 투영하는 데 사용합니다.
 */
export function pixelCoordinateToScreenRect(
  coordinate: PixelCoordinate,
  bounds: LngLatBounds,
  zoom: number
): ScreenRect {
  const topLeftWorldPoint = lngLatToWorldPoint({ lng: bounds.west, lat: bounds.north }, zoom);
  const currentScale = 2 ** (zoom - PIXEL_REFERENCE_ZOOM);

  return {
    x: coordinate.pixelX * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM * currentScale - topLeftWorldPoint.x,
    y: coordinate.pixelY * PIXEL_CELL_SIZE_AT_REFERENCE_ZOOM * currentScale - topLeftWorldPoint.y,
    size: getPixelCellScreenSize(zoom)
  };
}

/**
 * 지도 viewport bounds를 렌더링 또는 조회가 필요한 전역 픽셀 범위로 변환합니다.
 *
 * 반환 값은 포함 범위이므로 `startX <= pixelX <= endX` 형태로 사용할 수 있습니다.
 */
export function lngLatBoundsToPixelBounds(bounds: LngLatBounds): PixelBounds {
  const northwest = lngLatToPixelCoordinate({ lng: bounds.west, lat: bounds.north });
  const southeast = lngLatToPixelCoordinate({ lng: bounds.east, lat: bounds.south });

  return {
    startX: Math.min(northwest.pixelX, southeast.pixelX),
    startY: Math.min(northwest.pixelY, southeast.pixelY),
    endX: Math.max(northwest.pixelX, southeast.pixelX),
    endY: Math.max(northwest.pixelY, southeast.pixelY)
  };
}

/**
 * 위도/경도를 특정 줌 레벨의 Web Mercator 월드 좌표로 변환합니다.
 *
 * Web Mercator는 극지방을 표현할 수 없기 때문에 유효한 최대 위도 안으로 값을 제한합니다.
 */
export function lngLatToWorldPoint(coordinate: LngLatCoordinate, zoom: number): WorldPoint {
  const lat = clamp(coordinate.lat, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  const scale = MERCATOR_TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);

  return {
    x: ((coordinate.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

/**
 * 특정 줌 레벨의 Web Mercator 월드 좌표를 위도/경도로 변환합니다.
 */
export function worldPointToLngLat(point: WorldPoint, zoom: number): LngLatCoordinate {
  const scale = MERCATOR_TILE_SIZE * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const mercatorY = 0.5 - point.y / scale;
  const lat = (90 - (360 * Math.atan(Math.exp(-mercatorY * 2 * Math.PI))) / Math.PI);

  return { lng, lat };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
