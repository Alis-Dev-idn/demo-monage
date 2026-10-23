import { authHandlers } from "./auth";
import { accountHandlers } from "./account";
import { categoryHandlers } from "./category";
import { transactionHandlers } from "./transaction";
import { budgetHandlers } from "./budget";
import { reportHandlers } from "./report";
import { savingHandlers } from "./saving";
import { bookHandlers } from "./book";
import { subscriptionHandlers } from "./subscription";
import { exportHandlers } from "./export";
import { backupHandlers } from "./backup";
import { monthlyPlanHandlers } from "./monthlyPlan";
import { businessHandlers } from "./business";
import { demoHandlers } from "./demo";

export const handlers = [
  ...demoHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...categoryHandlers,
  ...transactionHandlers,
  ...budgetHandlers,
  ...reportHandlers,
  ...savingHandlers,
  ...bookHandlers,
  ...subscriptionHandlers,
  ...exportHandlers,
  ...backupHandlers,
  ...monthlyPlanHandlers,
  ...businessHandlers,
];
