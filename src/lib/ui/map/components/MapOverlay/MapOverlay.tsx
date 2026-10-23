import React from "react";

export interface MapOverlayProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
  className?: string;
  gap?: number | string;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({
  position,
  children,
  className = "",
  gap = "1rem",
}) => {
  const positions = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  const isLeft = position.endsWith("left");

  return (
    <div
      className={`absolute z-[10] pointer-events-none flex flex-col ${positions[position]} ${className}`}
      style={{
        padding: gap,
        alignItems: isLeft ? "flex-start" : "flex-end",
      }}
    >
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
