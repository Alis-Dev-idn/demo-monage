import { eventBus } from "@/utils/eventBus";
import * as categoryService from "@/services/category.service";
import type { Category, ID } from "@/types";
import type { CategoryFormData } from "@/schemas/category";

export async function createCategory(data: CategoryFormData): Promise<Category> {
  const created = await categoryService.createCategory(data);
  eventBus.emit("category:changed");
  return created;
}

export async function updateCategory(
  id: ID,
  data: Partial<CategoryFormData>,
): Promise<Category> {
  const updated = await categoryService.updateCategory(id, data);
  eventBus.emit("category:changed");
  return updated;
}

export async function deleteCategory(
  id: ID,
  moveTransactionsTo?: ID,
): Promise<void> {
  await categoryService.deleteCategory(id, { moveTransactionsTo });
  eventBus.emit("category:changed");
  eventBus.emit("transaction:changed");
}

export async function reorderCategories(
    orders: { id: string; order: number }[],
): Promise<Category[]> {
  const updated = await categoryService.reorderCategories(orders);
  eventBus.emit("category:changed");
  return updated;
}
