import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  UseTableOptions,
  UseTableResult,
  SortConfig,
  FilterConfig,
  TableParams,
  ResolvedColumnDef
} from "../types";
import { exportCsv as utilExportCsv } from "../utils/exportCsv";
import { exportExcel as utilExportExcel } from "../utils/exportExcel";

export function useTable<T extends object>(options: UseTableOptions<T>): UseTableResult<T> {
  const {
    data: initialData = [],
    fetchFn,
    columns: initialColumns,
    pagination: initialPagination = {},
    // selection = false,
    expandable,
    mobileBreakpoint = 768,
  } = options;

  // --- State ---
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPagination.page || 1);
  const [size, setSize] = useState(initialPagination.size || 10);
  const [total, setTotal] = useState(initialData.length);
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    new Set(initialColumns.filter(c => c.visible !== false).map(c => String(c.key)))
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  const isServerSide = !!fetchFn;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Mobile Detection ---
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mobileBreakpoint]);

  // --- Data Fetching / Processing ---
  const fetchData = useCallback(async (params: TableParams) => {
    if (!fetchFn) return;
    setLoading(true);
    try {
      const result = await fetchFn(params);
      setData(result.content);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const refresh = useCallback(() => {
    if (isServerSide) {
      fetchData({ page, size, sort: sorts, filters, search });
    }
  }, [isServerSide, fetchData, page, size, sorts, filters, search]);

  useEffect(() => {
    if (isServerSide) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetchData({ page, size, sort: sorts, filters, search });
      }, 300);
    }
  }, [isServerSide, page, size, sorts, filters, search, fetchData]);

  // Client-side processing
  const processedData = useMemo(() => {
    if (isServerSide) return data;

    let result = [...initialData];

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val => val != null && String(val).toLowerCase().includes(s))
      );
    }

    // Filters
    filters.forEach(f => {
      result = result.filter(row => {
        const val = (row as Record<string, unknown>)[f.key];
        switch (f.operator) {
          case "like": return String(val).toLowerCase().includes(String(f.value).toLowerCase());
          case "gte": return (val as number) >= (f.value as number);
          case "lte": return (val as number) <= (f.value as number);
          case "in": return Array.isArray(f.value) && (f.value as unknown[]).includes(val);
          default: return val === f.value;
        }
      });
    });

    // Sort
    if (sorts.length > 0) {
      const sortedSorts = [...sorts].sort((a, b) => a.priority - b.priority);
      result.sort((a, b) => {
        for (const s of sortedSorts) {
          const valA = (a as Record<string, unknown>)[s.key];
          const valB = (b as Record<string, unknown>)[s.key];
          if (valA !== valB) {
            const modifier = s.order === "asc" ? 1 : -1;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return valA > valB ? modifier : -modifier;
          }
        }
        return 0;
      });
    }

    // eslint-disable-next-line react-hooks/set-state-in-render
    setTotal(result.length);

    // Pagination
    const start = (page - 1) * size;
    return result.slice(start, start + size);
  }, [isServerSide, initialData, data, search, filters, sorts, page, size]);

  // --- Column Visibility & Offsets ---
  const visibleColumns = useMemo(() => {
    const filtered = initialColumns.filter(c => visibleColumnKeys.has(String(c.key)));

    // Parse a column width to pixel offset. Percentage / unknown units fall back to 100.
    const widthToPx = (raw: string | undefined): number => {
      if (!raw) return 100;
      const trimmed = raw.trim();
      if (trimmed.endsWith("%")) {
        if (typeof window !== "undefined") {
          // Best-effort warning during development
          console.warn(
            `[useTable] Pinned column width "${raw}" uses a percentage; ` +
            `pinned offset can only be computed in px. Falling back to 100px.`
          );
        }
        return 100;
      }
      const n = parseInt(trimmed, 10);
      return Number.isFinite(n) && n > 0 ? n : 100;
    };

    let leftOffset = 0;
    const leftPinned = filtered.filter(c => c.pinned === "left").map(c => {
      const resolved = { ...c, pinnedOffset: leftOffset } as ResolvedColumnDef<T>;
      leftOffset += widthToPx(c.width);
      return resolved;
    });

    let rightOffset = 0;
    const rightPinned = filtered.filter(c => c.pinned === "right").reverse().map(c => {
      const resolved = { ...c, pinnedOffset: rightOffset } as ResolvedColumnDef<T>;
      // eslint-disable-next-line react-hooks/immutability
      rightOffset += widthToPx(c.width);
      return resolved;
    }).reverse();

    const unpinned = filtered.filter(c => !c.pinned);

    return [...leftPinned, ...unpinned, ...rightPinned];
  }, [initialColumns, visibleColumnKeys]);

  // --- Helpers ---
  const toggleColumn = (key: string) => {
    const next = new Set(visibleColumnKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisibleColumnKeys(next);
  };

  const toggleRow = (row: T) => {
    const rowRecord = row as Record<string, unknown>;
    const key = String(rowRecord.id || rowRecord._id || JSON.stringify(row));
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const toggleAll = () => {
    if (selectedKeys.size === processedData.length) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set(processedData.map(row => {
        const r = row as Record<string, unknown>;
        return String(r.id || r._id || JSON.stringify(r));
      }));
      setSelectedKeys(next);
    }
  };

  const isSelected = (row: T) => {
    const rowRecord = row as Record<string, unknown>;
    const key = String(rowRecord.id || rowRecord._id || JSON.stringify(row));
    return selectedKeys.has(key);
  };

  const toggleExpand = (row: T) => {
    const rowRecord = row as Record<string, unknown>;
    const key = String(rowRecord.id || rowRecord._id || JSON.stringify(row));
    const next = new Set(expandedRows);
    if (next.has(key)) {
      next.delete(key);
    } else {
      if (!expandable?.multiple) next.clear();
      next.add(key);
    }
    setExpandedRows(next);
  };

  const isExpanded = (row: T) => {
    const rowRecord = row as Record<string, unknown>;
    const key = String(rowRecord.id || rowRecord._id || JSON.stringify(row));
    return expandedRows.has(key);
  };

  const totalPages = Math.ceil(total / size);

  return {
    data: processedData,
    loading,
    isEmpty: total === 0,
    page,
    size,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    setPage,
    setSize,
    sorts,
    setSort: setSorts,
    addSort: (key, order, priority) => {
      setSorts(prev => {
        const filtered = prev.filter(s => s.key !== key);
        return [...filtered, { key, order, priority: priority || prev.length + 1 }];
      });
    },
    removeSort: (key) => setSorts(prev => prev.filter(s => s.key !== key)),
    clearSort: () => setSorts([]),
    search,
    setSearch,
    filters,
    setFilter: (key, value, operator) => {
      setFilters(prev => {
        const filtered = prev.filter(f => f.key !== key);
        return [...filtered, { key, value, operator }];
      });
    },
    removeFilter: (key) => setFilters(prev => prev.filter(f => f.key !== key)),
    clearFilters: () => setFilters([]),
    visibleColumns,
    toggleColumn,
    showColumn: (key) => setVisibleColumnKeys(prev => new Set(prev).add(key)),
    hideColumn: (key) => setVisibleColumnKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    }),
    selectedRows: processedData.filter(row => isSelected(row)),
    selectedKeys: Array.from(selectedKeys),
    toggleRow,
    toggleAll,
    isSelected,
    clearSelection: () => setSelectedKeys(new Set()),
    exportCsv: (filename) => utilExportCsv(processedData, visibleColumns, filename || "export.csv"),
    exportExcel: (filename) => utilExportExcel(processedData, visibleColumns, filename || "export.xlsx"),
    refresh,
    expandedRows: Array.from(expandedRows),
    toggleExpand,
    isExpanded,
    collapseAll: () => setExpandedRows(new Set()),
    isMobile,
  };
}
