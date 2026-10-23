import { createContext, useContext } from "react";
import * as maplibregl from "maplibre-gl";

export interface MapContextValue {
  map: maplibregl.Map | null;
}

export const MapContext = createContext<MapContextValue>({
  map: null,
});

export const useMapContext = () => useContext(MapContext);
