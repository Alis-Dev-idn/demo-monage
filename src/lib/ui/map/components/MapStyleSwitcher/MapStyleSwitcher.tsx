import React from "react";
import { useMapContext } from "../Map/MapContext";

export interface MapStyleSwitcherProps {
  styles: {
    label: string;
    url: string;
  }[];
  onChange?: (styleUrl: string) => void;
  className?: string;
}

export const MapStyleSwitcher: React.FC<MapStyleSwitcherProps> = ({
  styles,
  onChange,
  className = "",
}) => {
  const { map } = useMapContext();

  const handleStyleChange = (url: string) => {
    if (map) {
      map.setStyle(url);
      onChange?.(url);
    }
  };

  return (
    <div
      role="group"
      aria-label="Base map style switcher"
      className={`flex flex-col gap-2 p-3 bg-[var(--ui-surface,white)] border border-[var(--ui-border,#e5e7eb)] rounded-[var(--ui-radius,8px)] shadow-md ${className}`}
    >
      <p className="text-xs font-bold text-[var(--ui-text-muted,#6b7280)] uppercase mb-1">Base Maps</p>
      {styles.map((s) => (
        <button
          key={s.url}
          type="button"
          onClick={() => handleStyleChange(s.url)}
          aria-label={`Switch to ${s.label} map style`}
          className="text-sm px-3 py-1.5 rounded-md hover:bg-[var(--ui-secondary,#f3f4f6)] text-left transition-colors font-medium"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};
