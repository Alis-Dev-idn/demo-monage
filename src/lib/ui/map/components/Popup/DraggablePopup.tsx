import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "../Map/MapContext";

export interface DraggablePopupProps {
  lng: number;
  lat: number;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  lineColor?: string;
}

export const DraggablePopup: React.FC<DraggablePopupProps> = ({
  lng,
  lat,
  children,
  open = true,
  onClose,
  className = "",
  lineColor = "#3b82f6" // blue-500 default
}) => {
  const { map } = useMapContext();
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false); // Flag if user manually dragged it

  const popupRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPopupPosRef = useRef({ x: 0, y: 0 });

  const updateAnchor = useCallback(() => {
    if (!map) return;
    const pos = map.project([lng, lat]);
    setAnchorPos({ x: pos.x, y: pos.y });
    
    // If user hasn't dragged, pin it right above the marker
    if (!hasMoved) {
      setPopupPos({ x: pos.x, y: pos.y - 20 });
    }
  }, [map, lng, lat, hasMoved]);

  useEffect(() => {
    if (!map) return;
    updateAnchor();
    
    // Update SVG and popup positions on map events
    map.on("move", updateAnchor);
    map.on("zoom", updateAnchor);
    
    return () => {
      map.off("move", updateAnchor);
      map.off("zoom", updateAnchor);
    };
  }, [map, updateAnchor]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setHasMoved(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPopupPosRef.current = { ...popupPos };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setPopupPos({
      x: initialPopupPosRef.current.x + dx,
      y: initialPopupPosRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!open || !map) return null;

  const mapContainer = map.getContainer();

  return createPortal(
    <>
      {/* SVG Canvas to draw the dashed line pointing to marker */}
      {hasMoved && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          <line
            x1={anchorPos.x}
            y1={anchorPos.y}
            x2={popupPos.x}
            y2={popupPos.y}
            stroke={lineColor}
            strokeWidth={2}
            strokeDasharray="6,4"
          />
          <circle cx={anchorPos.x} cy={anchorPos.y} r={4} fill={lineColor} />
        </svg>
      )}

      {/* The Draggable Popup Box */}
      <div
        ref={popupRef}
        className={`ui-draggable-popup ${className}`}
        style={{
          position: "absolute",
          left: popupPos.x,
          top: popupPos.y,
          transform: "translate(-50%, -100%)", // Center above point
          zIndex: 20,
          background: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none" // Prevent scroll on touch devices while dragging
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {onClose && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{ 
              position: 'absolute', 
              top: 4, 
              right: 8, 
              cursor: 'pointer', 
              background: 'none', 
              border: 'none',
              fontSize: '18px',
              color: '#666'
            }}
          >
            &times;
          </button>
        )}
        <div style={{ cursor: "text", userSelect: "text" }}>
          {children}
        </div>
      </div>
    </>,
    mapContainer
  );
};
