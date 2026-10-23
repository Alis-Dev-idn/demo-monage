import React from "react";

export const TableSkeleton: React.FC<{ columns: number; rows?: number }> = ({ 
  columns, 
  rows = 5 
}) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: columns }).map((_, j) => (
          <td key={j} className="px-4 py-3">
            <div className="table-skeleton-cell" style={{ height: "20px", background: "#f1f5f9", borderRadius: "4px", width: "100%" }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const TableEmpty: React.FC<{ colSpan: number; message?: string }> = ({
  colSpan,
  message = "No data available"
}) => (
  <tbody>
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
        {message}
      </td>
    </tr>
  </tbody>
);

/**
 * Skeleton variant for the mobile card layout. Mirrors `TableSkeleton` so the
 * loading state stays consistent between desktop and mobile.
 */
export const MobileCardSkeleton: React.FC<{ rows?: number; fields?: number }> = ({
  rows = 4,
  fields = 3,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="mobile-card mobile-card--skeleton">
        <div className="mobile-card-skeleton-line" style={{ width: "60%", height: 18 }} />
        {Array.from({ length: fields }).map((_, j) => (
          <div
            key={j}
            className="mobile-card-skeleton-line"
            style={{ width: `${40 + (j * 17) % 50}%`, height: 12, marginTop: 8 }}
          />
        ))}
      </div>
    ))}
  </>
);
