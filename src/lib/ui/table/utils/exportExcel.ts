import * as XLSX from "xlsx";
import { type ColumnDef } from "../types";

export function exportExcel<T>(
  data: T[],
  columns: ColumnDef<T>[],
  filename: string = "export.xlsx"
) {
  if (data.length === 0) return;

  const visibleColumns = columns.filter(c => c.visible !== false && !c.actions);

  const excelData = data.map(row => {
    const obj: Record<string, unknown> = {};
    visibleColumns.forEach(col => {
      const val = (row as Record<string, unknown>)[col.key as string];
      obj[col.label] = col.exportValue ? col.exportValue(val, row) : val;
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, filename);
}
