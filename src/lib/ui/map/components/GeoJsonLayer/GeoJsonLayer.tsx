import React, { useEffect } from "react";
import { useMapContext } from "../Map/MapContext";
import * as maplibregl from "maplibre-gl";
import type * as GeoJSON from "geojson";

export interface GeoJsonLayerProps {
  id: string;
  data: GeoJSON.FeatureCollection | GeoJSON.Feature;
  type?: "fill" | "line" | "circle";
  color?: string;
  opacity?: number;
  width?: number;
  visible?: boolean;
}

export const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  id,
  data,
  type = "fill",
  color = "#3b82f6",
  opacity = 0.6,
  width = 2,
  visible = true,
}) => {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map) return;

    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: data,
      });

      let layerConfig: maplibregl.AddLayerObject;

      const baseConfig = {
        id: layerId,
        source: sourceId,
        layout: {
          visibility: (visible ? "visible" : "none") as "visible" | "none",
        },
      };

      if (type === "fill") {
        layerConfig = {
          ...baseConfig,
          type: "fill",
          paint: {
            "fill-color": color,
            "fill-opacity": opacity,
          },
        };
      } else if (type === "line") {
        layerConfig = {
          ...baseConfig,
          type: "line",
          paint: {
            "line-color": color,
            "line-width": width,
            "line-opacity": opacity,
          },
        };
      } else {
        layerConfig = {
          ...baseConfig,
          type: "circle",
          paint: {
            "circle-color": color,
            "circle-radius": width,
            "circle-opacity": opacity,
          },
        };
      }

      map.addLayer(layerConfig);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const sourceId = `source-${id}`;
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data);
    }
  }, [data, map]);

  useEffect(() => {
    if (!map) return;
    const layerId = `layer-${id}`;
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");

      if (type === "fill") {
        map.setPaintProperty(layerId, "fill-color", color);
        map.setPaintProperty(layerId, "fill-opacity", opacity);
      } else if (type === "line") {
        map.setPaintProperty(layerId, "line-color", color);
        map.setPaintProperty(layerId, "line-width", width);
      } else if (type === "circle") {
        map.setPaintProperty(layerId, "circle-color", color);
      }
    }
  }, [visible, color, opacity, width, map]);

  return null;
};
