import { describe, expect, it } from "vitest";
import { buildCsv } from "./exportCsv";
import type { ColumnDef } from "../types";

interface Row {
  id: number;
  name: string;
  price: number | null;
}

const columns: ColumnDef<Row>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "price", label: "Price", exportValue: (v) => (v == null ? "-" : `$${v}`) },
];

describe("buildCsv()", () => {
  it("returns empty string for empty data", () => {
    expect(buildCsv([], columns)).toBe("");
  });

  it("emits header + rows", () => {
    const csv = buildCsv(
      [
        { id: 1, name: "Apple", price: 100 },
        { id: 2, name: "Banana", price: null },
      ],
      columns
    );
    expect(csv).toBe(["ID,Name,Price", "1,Apple,$100", "2,Banana,-"].join("\n"));
  });

  it("quotes values containing comma / quote / newline", () => {
    const csv = buildCsv<{ id: number; note: string }>(
      [{ id: 1, note: 'has, comma "and" quote' }],
      [
        { key: "id", label: "ID" },
        { key: "note", label: "Note" },
      ]
    );
    expect(csv).toBe('ID,Note\n1,"has, comma ""and"" quote"');
  });

  it("skips columns marked invisible or with actions", () => {
    const csv = buildCsv<Row>(
      [{ id: 1, name: "Apple", price: 100 }],
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name", visible: false },
        { key: "price", label: "Price" },
        { key: "id", label: "Actions", actions: () => null },
      ]
    );
    expect(csv).toBe("ID,Price\n1,100");
  });
});
