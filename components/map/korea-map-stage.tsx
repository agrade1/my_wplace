"use client";

import Map, {
  type LngLatBoundsLike,
  type ViewState,
  type ViewStateChangeEvent
} from "@vis.gl/react-maplibre";

type KoreaMapStageProps = {
  viewState: ViewState;
  onMove: (nextViewState: ViewState) => void;
  overlay: React.ReactNode;
  controls: React.ReactNode;
  showOverlay: boolean;
  overlayHint: string;
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
  overlayHint
}: KoreaMapStageProps) {
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
        {...viewState}
        onMove={(event: ViewStateChangeEvent) => onMove(event.viewState)}
        minZoom={5.4}
        maxZoom={18}
        maxBounds={KOREA_BOUNDS}
        mapStyle={MAP_STYLE}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
      </Map>

      {controls}

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
        {showOverlay ? (
          <div
            style={{
              pointerEvents: "auto",
              padding: 16,
              borderRadius: 20,
              backgroundColor: "rgba(248, 250, 252, 0.84)",
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
              backdropFilter: "blur(10px)"
            }}
          >
            {overlay}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
