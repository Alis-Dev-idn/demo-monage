import type { ReactNode } from "react";

export type SortOrder = "asc" | "desc";

export interface SortConfig {
  key: string;
  order: SortOrder;
  priority: number;
}

export interface FilterConfig {
  key: string;
  value: unknown;
  operator?: "eq" | "like" | "gte" | "lte" | "in";
}

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  pinned?: "left" | "right";
  visible?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  /** Optional formatter used by exportCsv / exportExcel. Falls back to raw value. */
  exportValue?: (value: unknown, row: T) => string | number | boolean | null | undefined;
  actions?: (row: T) => ReactNode;
  mobilePriority?: number;
}

export interface ExpandableConfig<T> {
  multiple?: boolean;
  trigger?: "icon" | "row";
  render?: (row: T) => ReactNode;
  renderAsync?: (row: T) => Promise<ReactNode>;
  loadingComponent?: ReactNode;
  cacheResult?: boolean;
}

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface TableParams {
  page: number;
  size: number;
  sort?: SortConfig[];
  filters?: FilterConfig[];
  search?: string;
}

export interface ResolvedColumnDef<T> extends ColumnDef<T> {
  pinnedOffset?: number;
}

export interface UseTableOptions<T> {
  data?: T[];
  fetchFn?: (params: TableParams) => Promise<PageResult<T>>;
  columns: ColumnDef<T>[];
  pagination?: {
    page?: number;
    size?: number;
  };
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  selection?: boolean;
  expandable?: ExpandableConfig<T>;
  mobileBreakpoint?: number;
}

export interface UseTableResult<T> {
  data: T[];
  loading: boolean;
  isEmpty: boolean;
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  sorts: SortConfig[];
  setSort: (sorts: SortConfig[]) => void;
  addSort: (key: string, order: SortOrder, priority?: number) => void;
  removeSort: (key: string) => void;
  clearSort: () => void;
  search: string;
  setSearch: (value: string) => void;
  filters: FilterConfig[];
  setFilter: (key: string, value: unknown, operator?: FilterConfig["operator"]) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  visibleColumns: ResolvedColumnDef<T>[];
  toggleColumn: (key: string) => void;
  showColumn: (key: string) => void;
  hideColumn: (key: string) => void;
  selectedRows: T[];
  selectedKeys: string[];
  toggleRow: (row: T) => void;
  toggleAll: () => void;
  isSelected: (row: T) => boolean;
  clearSelection: () => void;
  exportCsv: (filename?: string) => void;
  exportExcel: (filename?: string) => void;
  refresh: () => void;
  expandedRows: string[];
  toggleExpand: (row: T) => void;
  isExpanded: (row: T) => boolean;
  collapseAll: () => void;
  isMobile: boolean;
}
