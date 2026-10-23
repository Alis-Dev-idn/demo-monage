import type { ID, Tone } from "./common";

export type CategoryKind = "income" | "expense";

export interface Subcategory {
  _id: ID;
  categoryId: ID;
  name: string;
  order: number;
}

export interface Category {
  _id: ID;
  userId: ID;
  /** Pembukuan tempat kategori ini berada. */
  bookId?: ID;
  kind: CategoryKind;
  name: string;
  icon: string;
  tone: Tone;
  order: number;
  isDefault: boolean;
  subcategories: Subcategory[];
}
