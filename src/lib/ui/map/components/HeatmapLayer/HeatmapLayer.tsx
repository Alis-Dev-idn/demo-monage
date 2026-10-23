import React, { useEffect } from "react";
import * as maplibregl from "maplibre-gl";
import { useMapContext } from "../Map/MapContext";

export interface HeatmapPoint {
  lng: number;
  lat: number;
  weight?: number;
}

export interface HeatmapLayerProps {
  id: string;
  data: HeatmapPoint[];
  intensity?: number;
  radius?: number;
  opacity?: number;
  visible?: boolean;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  id,
  data,
  intensity = 1,
  radius = 20,
  opacity = 0.8,
  visible = true,
}) => {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map) return;

    const sourceId = `source-heatmap-${id}`;
    const layerId = `layer-heatmap-${id}`;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: data.map((p) => ({
        type: "Feature",
        properties: { weight: p.weight || 1 },
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat],
        },
      })),
    };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: layerId,
        type: "heatmap",
        source: sourceId,
        layout: {
          visibility: visible ? "visible" : "none",
        },
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": intensity,
          "heatmap-radius": radius,
          "heatmap-opacity": opacity,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgb(103,169,207)",
            0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)",
            0.8, "rgb(239,138,98)",
            1, "rgb(178,24,43)"
          ],
        },
      });
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const sourceId = `source-heatmap-${id}`;
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: data.map((p) => ({
          type: "Feature",
          properties: { weight: p.weight || 1 },
          geometry: {
            type: "Point",
            coordinates: [p.lng, p.lat],
          },
        })),
      });
    }
  }, [data, map]);

  useEffect(() => {
    if (!map) return;
    const layerId = `layer-heatmap-${id}`;
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      map.setPaintProperty(layerId, "heatmap-intensity", intensity);
      map.setPaintProperty(layerId, "heatmap-radius", radius);
      map.setPaintProperty(layerId, "heatmap-opacity", opacity);
    }
  }, [visible, intensity, radius, opacity, map]);

  return null;
};
