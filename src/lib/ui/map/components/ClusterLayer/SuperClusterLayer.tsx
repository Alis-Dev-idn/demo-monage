import React, { useEffect, useState, useCallback, useMemo } from "react";
import Supercluster from "supercluster";
import { useMapContext } from "../Map/MapContext";
import { Marker } from "../Marker/Marker";
import type * as GeoJSON from "geojson";

export interface ClusterPoint {
  id: string | number;
  lng: number;
  lat: number;
  properties?: Record<string, unknown>;
}

export interface SuperClusterLayerProps {
  points: ClusterPoint[];
  radius?: number;
  maxZoom?: number;
  renderMarker?: (point: ClusterPoint) => React.ReactNode;
  renderCluster?: (cluster: GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>, count: number) => React.ReactNode;
}

export const SuperClusterLayer: React.FC<SuperClusterLayerProps> = ({
  points,
  radius = 50,
  maxZoom = 20,
  renderMarker,
  renderCluster,
}) => {
  const { map } = useMapContext();
  const [clusters, setClusters] = useState<GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>[]>([]);
  const [index, setIndex] = useState<Supercluster | null>(null);

  const pointMap = useMemo(
    () => new Map(points.map((p) => [p.id, p])),
    [points]
  );

  useEffect(() => {
    const sc = new Supercluster({
      radius: radius,
      maxZoom: maxZoom,
    });

    const features: GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>[] = points.map((p) => ({
      type: "Feature",
      properties: { cluster: false, pointId: p.id, ...p.properties },
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat],
      },
    }));

    sc.load(features);
    setIndex(sc);
  }, [points, radius, maxZoom]);

  const updateClusters = useCallback(() => {
    if (!map || !index) return;
    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    const newClusters = index.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );
    setClusters(newClusters);
  }, [map, index]);

  useEffect(() => {
    if (!map || !index) return;

    updateClusters();
    map.on("moveend", updateClusters);
    map.on("zoomend", updateClusters);

    return () => {
      map.off("moveend", updateClusters);
      map.off("zoomend", updateClusters);
    };
  }, [map, index, updateClusters]);

  return (
    <>
      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates;
        const { cluster, pointId } = c.properties;
        const count = c.properties.point_count as number;

        if (cluster) {
          return (
            <Marker key={`cluster-${c.id}`} lng={lng} lat={lat}>
              {renderCluster ? (
                renderCluster(c, count)
              ) : (
                <div 
                  className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg cursor-pointer"
                  style={{ width: 30 + Math.min(count, 20), height: 30 + Math.min(count, 20) }}
                  onClick={() => {
                    const expansionZoom = index?.getClusterExpansionZoom(c.id as number);
                    map?.flyTo({ center: [lng, lat], zoom: expansionZoom });
                  }}
                >
                  {count as React.ReactNode}
                </div>
              )}
            </Marker>
          );
        }

        const point = pointMap.get(pointId as ClusterPoint["id"]);
        return (
          <Marker key={`point-${pointId}`} lng={lng} lat={lat}>
            {renderMarker && point ? (
              renderMarker(point)
            ) : (
              <div className="bg-red-500 w-3 h-3 rounded-full border-2 border-white shadow-sm" />
            )}
          </Marker>
        );
      })}
    </>
  );
};
