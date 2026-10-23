import type { PlanTier, User } from "@/types";

/**
 * Akun demo — satu per tier paket. Dipakai testers / demo presentasi
 * untuk lihat perbedaan kuota & gating di tiap paket tanpa register manual.
 *
 * Email & password ditampilkan di LoginPage (panel "Akun Demo") supaya
 * mudah copy-paste.
 */
export interface DemoAccount {
  tier: PlanTier;
  email: string;
  password: string;
  user: User;
}

const baseUser = (id: string, name: string, email: string): User => ({
  _id: id,
  email,
  name,
  preferences: {
    currency: "IDR",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    budgetNotification: {
      enabled: true,
      warnThreshold: 75,
      overThreshold: 100,
    },
  },
  onboardedAt: "2026-05-01T00:00:00.000Z",
  createdAt: "2026-04-15T00:00:00.000Z",
});

export const demoAccounts: DemoAccount[] = [
  {
    tier: "free",
    email: "free@monage.demo",
    password: "demo123",
    user: baseUser("u-free", "Rina (Free)", "free@monage.demo"),
  },
  {
    tier: "personal",
    email: "personal@monage.demo",
    password: "demo123",
    user: baseUser("u-personal", "Budi (Personal)", "personal@monage.demo"),
  },
  {
    tier: "premium",
    email: "premium@monage.demo",
    password: "demo123",
    user: baseUser("u-premium", "Sari (Premium)", "premium@monage.demo"),
  },
  {
    tier: "business",
    email: "business@monage.demo",
    password: "demo123",
    user: baseUser("u-business", "Andi (Bisnis)", "business@monage.demo"),
  },
];

export function findDemoByCredentials(
  email: string,
  password: string,
): DemoAccount | undefined {
  return demoAccounts.find(
    (d) =>
      d.email.toLowerCase() === email.toLowerCase() && d.password === password,
  );
}

export function findDemoByTier(tier: PlanTier): DemoAccount | undefined {
  return demoAccounts.find((d) => d.tier === tier);
}
