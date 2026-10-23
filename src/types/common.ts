export type ID = string;
export type ISODate = string;
export type IDRAmount = number;

export type Tone =
  | "emerald"
  | "orange"
  | "blue"
  | "amber"
  | "cyan"
  | "violet"
  | "rose"
  | "accent"
  | "neutral";

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
