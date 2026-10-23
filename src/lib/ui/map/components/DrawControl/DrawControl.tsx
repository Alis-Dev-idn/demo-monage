import React, { useState, useEffect, useMemo } from "react";
import { useMapContext } from "../Map/MapContext";
import * as maplibregl from "maplibre-gl";
import type * as GeoJSON from "geojson";
import { GeoJsonLayer } from "../GeoJsonLayer/GeoJsonLayer";

export interface DrawControlProps {
  mode?: "polygon" | "line" | "point" | "none";
  onCreate?: (feature: GeoJSON.Feature) => void;
  onUpdate?: (feature: GeoJSON.Feature) => void;
  active?: boolean;
}

export const DrawControl: React.FC<DrawControlProps> = ({
  mode = "none",
  onCreate,
  onUpdate,
  active = false,
}) => {
  const { map } = useMapContext();
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!map || mode === "none" || !active) {
      setPoints([]);
      return;
    }

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      if (mode === "point") {
        const feature = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords } } as GeoJSON.Feature;
        onCreate?.(feature);
        return;
      }

      const newPoints = [...points, coords];
      setPoints(newPoints);

      if (mode === "line" && newPoints.length >= 2) {
        const feature = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: newPoints } } as GeoJSON.Feature;
        onUpdate?.(feature);
      } else if (mode === "polygon" && newPoints.length >= 3) {
        const feature = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...newPoints, newPoints[0]]] } } as GeoJSON.Feature;
        onUpdate?.(feature);
      }
    };

    const handleDoubleClick = () => {
      if (mode === "line" || mode === "polygon") {
        let finalFeature;
        if (mode === "line") {
          finalFeature = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points } } as GeoJSON.Feature;
        } else {
          finalFeature = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...points, points[0]]] } } as GeoJSON.Feature;
        }
        onCreate?.(finalFeature);
        setPoints([]);
      }
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDoubleClick);

    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDoubleClick);
    };
  }, [map, mode, active, points]);

  const previewFeature = useMemo<GeoJSON.Feature | null>(() => {
    if (!active || mode === "none" || mode === "point" || points.length === 0) return null;
    if (mode === "line") {
      if (points.length < 2) {
        return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: points[0] } } as GeoJSON.Feature;
      }
      return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points } } as GeoJSON.Feature;
    }
    if (mode === "polygon") {
      if (points.length < 3) {
        return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points } } as GeoJSON.Feature;
      }
      return {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
      } as GeoJSON.Feature;
    }
    return null;
  }, [active, mode, points]);

  if (!previewFeature) return null;

  const layerType =
    previewFeature.geometry.type === "Polygon" ? "fill" :
    previewFeature.geometry.type === "Point" ? "circle" : "line";

  return (
    <GeoJsonLayer
      id="__draw-preview"
      type={layerType}
      data={previewFeature}
      color="#3b82f6"
      opacity={0.4}
    />
  );
};
