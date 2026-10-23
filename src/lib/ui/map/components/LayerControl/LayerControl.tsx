import React from "react";

export interface LayerControlProps {
  layers: {
    id: string;
    label: string;
    visible: boolean;
  }[];
  onToggle: (id: string) => void;
  className?: string;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggle,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-2 p-3 bg-[var(--ui-surface,white)] border border-[var(--ui-border,#e5e7eb)] rounded-[var(--ui-radius,8px)] shadow-md ${className}`}>
      <p className="text-xs font-bold text-[var(--ui-text-muted,#6b7280)] uppercase mb-1">Layers</p>
      {layers.map((l) => (
        <label key={l.id} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={l.visible}
            onChange={() => onToggle(l.id)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
            {l.label}
          </span>
        </label>
      ))}
    </div>
  );
};
