"use client";

import { useMemo, useRef, useState } from "react";
import Map, {
  type MapRef,
  type LngLatBoundsLike,
  type ViewState,
  type ViewStateChangeEvent
} from "@vis.gl/react-maplibre";
import type { LngLatBounds, LngLatCoordinate, ScreenPoint } from "@/features/pixel-editor/map-pixel-coordinate";
import type { LngLatBounds as MapLibreLngLatBounds } from "maplibre-gl";

export type MapProjection = {
  projectLngLat: (coordinate: LngLatCoordinate) => ScreenPoint | null;
  unprojectScreenPoint: (point: ScreenPoint) => LngLatCoordinate | null;
};

type KoreaMapStageProps = {
  viewState: ViewState;
  onMove: (nextViewState: ViewState) => void;
  overlay: (projection: MapProjection) => React.ReactNode;
  controls: React.ReactNode;
  showOverlay: boolean;
  overlayHint: string;
  onBoundsChange: (bounds: LngLatBounds) => void;
  onMapClick: () => void;
};

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const KOREA_BOUNDS: LngLatBoundsLike = [
  [123.5, 31.5],
  [132.8, 39.8]
];

export function KoreaMapStage({
  viewState,
  onMove,
  overlay,
  controls,
  showOverlay,
  overlayHint,
  onBoundsChange,
  onMapClick
}: KoreaMapStageProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const projection = useMemo<MapProjection>(
    () => ({
      projectLngLat: (coordinate) => {
        const point = mapRef.current?.project([coordinate.lng, coordinate.lat]);
        if (!point) return null;

        return { x: point.x, y: point.y };
      },
      unprojectScreenPoint: (point) => {
        const lngLat = mapRef.current?.unproject([point.x, point.y]);
        if (!lngLat) return null;

        return { lng: lngLat.lng, lat: lngLat.lat };
      }
    }),
    []
  );

  const notifyBoundsChange = (event: ViewStateChangeEvent) => {
    onMove(event.viewState);
    onBoundsChange(toLngLatBounds(event.target.getBounds()));
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "#dbe4d3"
      }}
    >
      <Map
        ref={mapRef}
        {...viewState}
        onLoad={(event) => {
          setIsMapReady(true);
          onBoundsChange(toLngLatBounds(event.target.getBounds()));
        }}
        onClick={onMapClick}
        onMove={notifyBoundsChange}
        minZoom={5.4}
        maxZoom={18}
        maxBounds={KOREA_BOUNDS}
        mapStyle={MAP_STYLE}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
      </Map>

      {showOverlay && isMapReady ? (
        overlay(projection)
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            alignItems: "center",
            justifyItems: "center",
            pointerEvents: "none",
            padding: 24
          }}
        >
          <div
            style={{
              maxWidth: 320,
              padding: "14px 18px",
              borderRadius: 999,
              backgroundColor: "rgba(15, 23, 42, 0.74)",
              color: "#f8fafc",
              textAlign: "center",
              fontSize: 14,
              lineHeight: 1.5
            }}
          >
            {overlayHint}
          </div>
        </div>
      )}

      {controls}
    </div>
  );
}

function toLngLatBounds(bounds: MapLibreLngLatBounds): LngLatBounds {
  const west = bounds.getWest();
  const east = bounds.getEast();

  return {
    west: Math.min(west, east),
    south: bounds.getSouth(),
    east: Math.max(west, east),
    north: bounds.getNorth()
  };
}
