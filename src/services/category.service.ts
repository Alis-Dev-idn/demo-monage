import { api } from "@/utils/api";
import type { Category, CategoryKind, ID, Subcategory } from "@/types";
import type { CategoryFormData, SubcategoryFormData } from "@/schemas/category";

export function fetchCategories(kind?: CategoryKind): Promise<Category[]> {
  return api().get<Category[]>("/categories", {
    params: kind ? { kind } : undefined,
  });
}

export function createCategory(data: CategoryFormData): Promise<Category> {
  return api().post<Category>("/categories", data);
}

export function updateCategory(
  id: ID,
  data: Partial<CategoryFormData>,
): Promise<Category> {
  return api().patch<Category>(`/categories/${id}`, data);
}

export interface DeleteCategoryOptions {
  moveTransactionsTo?: ID;
}

export function deleteCategory(
  id: ID,
  opts: DeleteCategoryOptions = {},
): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/categories/${id}`, {
    params: opts.moveTransactionsTo ? { moveTransactionsTo: opts.moveTransactionsTo } : undefined,
  });
}

export function reorderCategories(
  orders: Array<{ id: ID; order: number }>,
): Promise<Category[]> {
  return api().patch<Category[]>("/categories/reorder", { orders });
}

export function createSubcategory(
  categoryId: ID,
  data: SubcategoryFormData,
): Promise<Subcategory> {
  return api().post<Subcategory>(`/categories/${categoryId}/subcategories`, data);
}

export function updateSubcategory(
  categoryId: ID,
  subId: ID,
  data: SubcategoryFormData,
): Promise<Subcategory> {
  return api().patch<Subcategory>(
    `/categories/${categoryId}/subcategories/${subId}`,
    data,
  );
}

export function deleteSubcategory(categoryId: ID, subId: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(
    `/categories/${categoryId}/subcategories/${subId}`,
  );
}
