import { type ColumnDef } from "../types";

const escape = (raw: unknown) => {
  if (raw === null || raw === undefined) return "";
  const s = String(raw);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * Pure helper that builds the CSV content string for the given data and columns.
 * Exposed separately from `exportCsv` so it can be unit-tested without DOM.
 */
export function buildCsv<T>(data: T[], columns: ColumnDef<T>[]): string {
  if (data.length === 0) return "";
  const visibleColumns = columns.filter((c) => c.visible !== false && !c.actions);
  const headers = visibleColumns.map((c) => c.label);

  return [
    headers.map(escape).join(","),
    ...data.map((row) =>
      visibleColumns
        .map((col) => {
          const val = (row as Record<string, unknown>)[col.key as string];
          const out = col.exportValue ? col.exportValue(val, row) : val;
          return escape(out);
        })
        .join(",")
    ),
  ].join("\n");
}

export function exportCsv<T>(
  data: T[],
  columns: ColumnDef<T>[],
  filename: string = "export.csv"
) {
  const csvContent = buildCsv(data, columns);
  if (!csvContent) return;

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  queueMicrotask(() => URL.revokeObjectURL(url));
}
