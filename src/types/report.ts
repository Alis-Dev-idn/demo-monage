import type { Account } from "./account";
import type { ID, IDRAmount, ISODate, Tone } from "./common";
import type { Transaction } from "./transaction";

export interface DashboardSummary {
  totalBalance: IDRAmount;
  monthSummary: {
    income: IDRAmount;
    expense: IDRAmount;
    net: IDRAmount;
  };
  cashflowDaily: Array<{
    date: ISODate;
    income: IDRAmount;
    expense: IDRAmount;
  }>;
  expenseByCategory: Array<{
    categoryId: ID;
    categoryName: string;
    icon: string;
    tone: Tone;
    amount: IDRAmount;
    percent: number;
  }>;
  recentTransactions: Transaction[];
  accounts: Account[];
}

export interface ReportData {
  period: { from: ISODate; to: ISODate };
  cashflow: Array<{ date: ISODate; income: IDRAmount; expense: IDRAmount }>;
  expenseByCategory: Array<{ categoryId: ID; amount: IDRAmount; percent: number }>;
  monthlyTrend: Array<{
    year: number;
    month: number;
    income: IDRAmount;
    expense: IDRAmount;
  }>;
  topExpenses: Transaction[];
}
