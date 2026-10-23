import React from "react";
import { GeoJsonLayer } from "../GeoJsonLayer/GeoJsonLayer";

export interface RouteProps {
  id: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  visible?: boolean;
}

export const Route: React.FC<RouteProps> = ({
  id,
  coordinates,
  color = "#3b82f6",
  width = 4,
  opacity = 0.8,
  visible = true,
}) => {
  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coordinates,
    },
  };

  return (
    <GeoJsonLayer
      id={id}
      data={{ type: "FeatureCollection", features: [geojson] }}
      type="line"
      color={color}
      width={width}
      opacity={opacity}
      visible={visible}
    />
  );
};
