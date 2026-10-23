import React, { useState, useEffect } from "react";
import type { UseTableOptions, UseTableResult } from "../types";
import { useTable } from "../hooks/useTable";
import { TableSkeleton, TableEmpty, MobileCardSkeleton } from "./TableStates";
import { MobileCard } from "./MobileCard";
import "./table.css";

function getRowKey<T>(row: T, fallbackIndex: number): React.Key {
  const r = row as Record<string, unknown>;
  const id = r.id ?? r._id;
  return id != null ? String(id) : `row-${fallbackIndex}`;
}

export interface TableProps<T extends object> extends UseTableOptions<T> {
  showPagination?: boolean;
  showColumnToggle?: boolean;
  showExport?: boolean;
  exportFormats?: ("csv" | "excel")[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
  cellClassName?: string;
  mobileCardClassName?: string;
  paginationClassName?: string;
  columnToggleClassName?: string;
  exportClassName?: string;
}

export const Table = <T extends object>(props: TableProps<T>) => {
  const table = useTable(props);
  const {
    showPagination = true,
    showColumnToggle = false,
    showExport = false,
    className = "",
    headerClassName = "",
    rowClassName = "",
    cellClassName = "",
    mobileCardClassName = "",
  } = props;

  if (table.isMobile) {
    return (
      <div className={`table-mobile-view ${className}`}>
        {table.loading ? (
          <MobileCardSkeleton />
        ) : table.isEmpty ? (
          <div className="p-8 text-center text-slate-500">No data available</div>
        ) : (
          table.data.map((row, i) => (
            <MobileCard
              key={getRowKey(row, i)}
              row={row}
              columns={table.visibleColumns}
              selection={props.selection}
              isSelected={table.isSelected(row)}
              onToggleRow={() => table.toggleRow(row)}
              isExpanded={table.isExpanded(row)}
              onToggleExpand={() => table.toggleExpand(row)}
              className={mobileCardClassName}
            />
          ))
        )}
        {showPagination && <TablePagination table={table} className={props.paginationClassName} />}
      </div>
    );
  }

  const getRowClass = (row: T) => {
    if (typeof rowClassName === "function") return rowClassName(row);
    return rowClassName;
  };

  return (
    <div className={`table-root ${className}`}>
      <div className="table-header-toolbar">
        {showColumnToggle && <TableColumnToggle table={table} className={props.columnToggleClassName} />}
        {showExport && <TableExportButton table={table} className={props.exportClassName} />}
      </div>

      <div className="table-scroll-container">
        <table className="table-element">
          <thead className={`table-thead ${headerClassName}`}>
            <tr>
              {props.selection && (
                <th className="table-th selection-cell sticky-col" style={{ left: 0, zIndex: 10 }}>
                  <input type="checkbox" onChange={table.toggleAll} checked={table.selectedRows.length === table.data.length && table.data.length > 0} />
                </th>
              )}
              {table.visibleColumns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`table-th ${col.pinned ? "sticky-col" : ""} ${col.sortable ? "sortable-header" : ""}`}
                  style={{
                    position: col.pinned ? "sticky" : undefined,
                    left: col.pinned === "left" ? col.pinnedOffset : undefined,
                    right: col.pinned === "right" ? col.pinnedOffset : undefined,
                    width: col.width,
                    zIndex: col.pinned ? 5 : 1
                  }}
                  onClick={() => col.sortable && table.addSort(String(col.key), "asc")}
                >
                  <div className="th-content">
                    {col.label}
                    {col.sortable && (
                      <span className="sort-indicator">
                        {table.sorts.find(s => s.key === col.key)?.order === "asc" ? " ↑" :
                          table.sorts.find(s => s.key === col.key)?.order === "desc" ? " ↓" : ""}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {table.loading ? (
            <TableSkeleton columns={table.visibleColumns.length + (props.selection ? 1 : 0)} />
          ) : table.isEmpty ? (
            <TableEmpty colSpan={table.visibleColumns.length + (props.selection ? 1 : 0)} />
          ) : (
            <tbody className="table-tbody">
              {table.data.map((row, i) => {
                const isExpanded = table.isExpanded(row);
                const rowExpandable = props.expandable && (props.expandable.render || props.expandable.renderAsync);
                const rowTrigger = props.expandable?.trigger === "row" && rowExpandable;
                return (
                  <React.Fragment key={getRowKey(row, i)}>
                    <tr
                      className={`table-tr ${getRowClass(row)} ${rowTrigger ? "table-tr--clickable" : ""}`}
                      onClick={rowTrigger ? () => table.toggleExpand(row) : undefined}
                      style={rowTrigger ? { cursor: "pointer" } : undefined}
                    >
                      {props.selection && (
                        <td
                          className="table-td selection-cell sticky-col"
                          style={{ left: 0, zIndex: 4 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input type="checkbox" checked={table.isSelected(row)} onChange={() => table.toggleRow(row)} />
                        </td>
                      )}
                      {table.visibleColumns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={`table-td ${col.pinned ? "sticky-col" : ""} ${cellClassName}`}
                          style={{
                            position: col.pinned ? "sticky" : undefined,
                            left: col.pinned === "left" ? col.pinnedOffset : undefined,
                            right: col.pinned === "right" ? col.pinnedOffset : undefined,
                            zIndex: col.pinned ? 3 : 1
                          }}
                        >
                          {col.actions ? (
                            col.actions(row)
                          ) : col.render ? (
                            col.render((row as Record<string, unknown>)[col.key as string], row)
                          ) : (
                            String((row as Record<string, unknown>)[col.key as string] ?? "")
                          )}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && (
                      <tr className="table-expanded-row">
                        <td colSpan={table.visibleColumns.length + (props.selection ? 1 : 0)} className="p-0">
                          <div className="expanded-content-wrapper">
                            {props.expandable?.render && props.expandable.render(row)}
                            {props.expandable?.renderAsync && (
                              <AsyncExpandedContent
                                rowKey={getRowKey(row, i)}
                                row={row}
                                renderAsync={props.expandable.renderAsync}
                                loadingComponent={props.expandable.loadingComponent}
                                cacheResult={props.expandable.cacheResult}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {showPagination && <TablePagination table={table} className={props.paginationClassName} />}
    </div>
  );
};

// --- Sub-components ---

export function TablePagination<T extends object>({
  table,
  className = "",
  pageSizeOptions = [10, 25, 50, 100],
}: { table: UseTableResult<T>; className?: string; pageSizeOptions?: number[] }) {
  return (
    <div className={`table-pagination ${className}`}>
      <div className="pagination-info">
        Page {table.page} of {table.totalPages} ({table.total} total)
      </div>
      <div className="pagination-controls">
        <button disabled={!table.hasPrev} onClick={() => table.setPage(table.page - 1)} className="pagination-btn">
          Prev
        </button>
        <button disabled={!table.hasNext} onClick={() => table.setPage(table.page + 1)} className="pagination-btn">
          Next
        </button>
        <select value={table.size} onChange={(e) => table.setSize(Number(e.target.value))} className="pagination-select">
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function TableColumnToggle<T extends object>({
  table,
  className = "",
  label = "Columns",
}: { table: UseTableResult<T>; className?: string; label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`column-toggle ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
        {label}
      </button>
      {isOpen && (
        <div className="toggle-dropdown">
          {table.visibleColumns.map((col) => (
            <label key={String(col.key)} className="toggle-item">
              <input type="checkbox" checked={col.visible !== false} onChange={() => table.toggleColumn(String(col.key))} />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export function TableExportButton<T extends object>({
  table,
  formats = ["csv", "excel"],
  className = "",
  label = "Export",
}: { table: UseTableResult<T>; formats?: ("csv" | "excel")[]; className?: string; label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`export-button ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="export-btn">
        {label}
      </button>
      {isOpen && (
        <div className="export-dropdown">
          {formats.includes("csv") && (
            <button onClick={() => { table.exportCsv(); setIsOpen(false); }} className="dropdown-item">CSV</button>
          )}
          {formats.includes("excel") && (
            <button onClick={() => { table.exportExcel(); setIsOpen(false); }} className="dropdown-item">Excel</button>
          )}
        </div>
      )}
    </div>
  );
};

// --- Utils ---

const asyncExpandCache = new Map<React.Key, React.ReactNode>();

function AsyncExpandedContent<T>({
  rowKey,
  row,
  renderAsync,
  loadingComponent,
  cacheResult,
}: {
  rowKey: React.Key;
  row: T;
  renderAsync: (row: T) => Promise<React.ReactNode>;
  loadingComponent?: React.ReactNode;
  cacheResult?: boolean;
}) {
  const cached = cacheResult ? asyncExpandCache.get(rowKey) : undefined;
  const [content, setContent] = useState<React.ReactNode>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    if (cacheResult && asyncExpandCache.has(rowKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(asyncExpandCache.get(rowKey));
      setLoading(false);
      return;
    }
    let alive = true;
    renderAsync(row).then((res) => {
      if (!alive) return;
      if (cacheResult) asyncExpandCache.set(rowKey, res);
      setContent(res);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [row, renderAsync, rowKey, cacheResult]);

  if (loading) return <>{loadingComponent || <div>Loading details...</div>}</>;
  return <>{content}</>;
};

// Attach sub-components to Table
// eslint-disable-next-line react-refresh/only-export-components
export const TableComponent = Object.assign(Table, {
  Pagination: TablePagination,
  ColumnToggle: TableColumnToggle,
  ExportButton: TableExportButton,
});
