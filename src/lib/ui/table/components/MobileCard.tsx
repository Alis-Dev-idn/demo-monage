import React, { useState } from "react";
import type { ResolvedColumnDef } from "../types";

export interface MobileCardProps<T> {
  row: T;
  columns: ResolvedColumnDef<T>[];
  selection?: boolean;
  isSelected?: boolean;
  onToggleRow?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandableContent?: React.ReactNode;
  className?: string;
}

export const MobileCard = <T extends object>({
  row,
  columns,
  selection,
  isSelected,
  onToggleRow,
  isExpanded: isRowExpanded,
  onToggleExpand,
  expandableContent,
  className = "",
}: MobileCardProps<T>) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isRowExpanded !== undefined ? isRowExpanded : internalExpanded;
  const toggle = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const titleCol = columns.find(c => c.mobilePriority === 1) || columns[0];
  const actionsCol = columns.find(c => c.actions);
  const priority2Cols = columns.filter(c => c.mobilePriority === 2 && c !== titleCol);
  const hiddenCols = columns.filter(c => (c.mobilePriority === undefined || c.mobilePriority >= 3) && c !== titleCol && c !== actionsCol);

  return (
    <div className={`mobile-card ${className}`}>
      <div className="mobile-card-header">
        {selection && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleRow}
            className="mobile-card-checkbox"
          />
        )}
        <div className="mobile-card-title">
          {titleCol.render
            ? titleCol.render((row as Record<string, unknown>)[titleCol.key as string], row)
            : String((row as Record<string, unknown>)[titleCol.key as string] || "")}
        </div>
        {actionsCol && (
          <div className="mobile-card-actions">
            {actionsCol.actions!(row)}
          </div>
        )}
      </div>

      <div className="mobile-card-body">
        {priority2Cols.map(col => (
          <div key={String(col.key)} className="mobile-card-field">
            <span className="mobile-card-label">{col.label}</span>
            <span className="mobile-card-value">
              {col.render
                ? col.render((row as Record<string, unknown>)[col.key as string], row)
                : String((row as Record<string, unknown>)[col.key as string] || "")}
            </span>
          </div>
        ))}

        {isExpanded && (
          <div className="mobile-card-expanded">
            {hiddenCols.map(col => (
              <div key={String(col.key)} className="mobile-card-field">
                <span className="mobile-card-label">{col.label}</span>
                <span className="mobile-card-value">
                  {col.render
                    ? col.render((row as Record<string, unknown>)[col.key as string], row)
                    : String((row as Record<string, unknown>)[col.key as string] || "")}
                </span>
              </div>
            ))}
            {expandableContent && <div className="mobile-card-custom-expand">{expandableContent}</div>}
          </div>
        )}
      </div>

      {(hiddenCols.length > 0 || expandableContent) && (
        <button className="mobile-card-toggle" onClick={toggle}>
          {isExpanded ? "Show less" : `Show more (${hiddenCols.length} fields)`}
        </button>
      )}
    </div>
  );
};
