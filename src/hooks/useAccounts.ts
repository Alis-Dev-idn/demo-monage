import { eventBus } from "@/utils/eventBus";
import * as accountService from "@/services/account.service";
import type { Account, ID } from "@/types";
import type { AccountFormData } from "@/schemas/account";

export async function createAccount(data: AccountFormData): Promise<Account> {
  const created = await accountService.createAccount(data);
  eventBus.emit("account:changed");
  return created;
}

export async function updateAccount(
  id: ID,
  data: Partial<AccountFormData>,
): Promise<Account> {
  const updated = await accountService.updateAccount(id, data);
  eventBus.emit("account:changed");
  return updated;
}

export async function deleteAccount(
  id: ID,
  moveTransactionsTo?: ID,
): Promise<void> {
  await accountService.deleteAccount(id, { moveTransactionsTo });
  eventBus.emit("account:changed");
  eventBus.emit("transaction:changed");
}

export async function reorderAccounts(
  orders: Array<{ _id: ID; order: number }>,
): Promise<Account[]> {
  const updated = await accountService.reorderAccounts(orders);
  eventBus.emit("account:changed");
  return updated;
}
