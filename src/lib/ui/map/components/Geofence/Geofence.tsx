import React, { useEffect, useRef } from "react";
import { GeoJsonLayer } from "../GeoJsonLayer/GeoJsonLayer";

export interface GeofenceProps {
  id: string;
  polygon: [number, number][]; // Array of [lng, lat]
  pointsToCheck?: { id: string; lng: number; lat: number }[];
  color?: string;
  opacity?: number;
  onEnter?: (pointId: string) => void;
  onLeave?: (pointId: string) => void;
}

export const Geofence: React.FC<GeofenceProps> = ({
  id,
  polygon,
  pointsToCheck = [],
  color = "#ef4444",
  opacity = 0.2,
  onEnter,
  onLeave,
}) => {
  const presenceRef = useRef<Record<string, boolean>>({});

  // Point in polygon algorithm (Ray casting)
  const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  useEffect(() => {
    pointsToCheck.forEach((p) => {
      const isInside = isPointInPolygon([p.lng, p.lat], polygon);
      const wasInside = presenceRef.current[p.id] || false;

      if (isInside && !wasInside) {
        onEnter?.(p.id);
        presenceRef.current[p.id] = true;
      } else if (!isInside && wasInside) {
        onLeave?.(p.id);
        presenceRef.current[p.id] = false;
      }
    });
  }, [pointsToCheck, polygon]);

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [polygon],
        },
      },
    ],
  };

  return (
    <>
      {/* Fill */}
      <GeoJsonLayer
        id={`${id}-fill`}
        data={geojson}
        type="fill"
        color={color}
        opacity={opacity}
      />
      {/* Outline */}
      <GeoJsonLayer
        id={`${id}-outline`}
        data={geojson}
        type="line"
        color={color}
        opacity={1}
        width={2}
      />
    </>
  );
};
