import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { createRoot, type Root } from "react-dom/client";
import { useMapContext } from "../Map/MapContext";

export interface PopupProps {
  lng: number;
  lat: number;
  children: React.ReactNode;
  open?: boolean;
  className?: string;
  maxWidth?: string;
  closeButton?: boolean;
  closeOnClick?: boolean;
}

export const Popup: React.FC<PopupProps> = ({
  lng,
  lat,
  children,
  open = true,
  className = "",
  maxWidth = "240px",
  closeButton = true,
  closeOnClick = false,
}) => {
  const { map } = useMapContext();
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const elementRef = useRef<HTMLDivElement>(document.createElement("div"));
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!map) return;

    const popup = new maplibregl.Popup({
      closeButton,
      closeOnClick,
      className,
      maxWidth,
    })
      .setLngLat([lng, lat])
      .setDOMContent(elementRef.current);

    if (open) {
      popup.addTo(map);
    }

    popupRef.current = popup;

    return () => {
      popup.remove();
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.setLngLat([lng, lat]);
    }
  }, [lng, lat]);

  useEffect(() => {
    if (popupRef.current) {
      if (open) {
        if (!popupRef.current.isOpen()) popupRef.current.addTo(map!);
      } else {
        popupRef.current.remove();
      }
    }
  }, [open, map]);

  useEffect(() => {
    if (children) {
      if (!rootRef.current) {
        rootRef.current = createRoot(elementRef.current);
      }
      rootRef.current.render(<div className="ui-popup-content">{children}</div>);
    }
  }, [children]);

  return null;
};
