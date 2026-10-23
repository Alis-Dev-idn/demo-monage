import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@dep/axios";
import * as subscriptionService from "@/services/subscription.service";
import { eventBus } from "@/utils/eventBus";
import { useAuth } from "@/hooks/useAuth";
import type {
  ChangeSubscriptionResponse,
  PaymentMethodId,
  PlanTier,
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
} from "@/types";

export interface SubscriptionContextValue {
  plans: SubscriptionPlan[];
  subscription: UserSubscription | null;
  usage: UsageStats | null;
  /** Plan aktif user (resolve dari subscription.tier). null saat belum load. */
  currentPlan: SubscriptionPlan | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  refetchUsage: () => Promise<void>;
  /**
   * Pindah plan (upgrade / downgrade). Mengembalikan response normal yang
   * include `checkout?` untuk flow gateway pembayaran. Caller bertanggung
   * jawab redirect ke `checkout.checkoutUrl` kalau ada.
   */
  change: (
    tier: Exclude<PlanTier, "business">,
    paymentMethod?: PaymentMethodId,
  ) => Promise<ChangeSubscriptionResponse>;
  /** Set auto-cancel di akhir periode. */
  cancel: () => Promise<UserSubscription>;
  /**
   * Klaim trial Premium 1 bulan (gratis, sekali per akun). Setelah sukses,
   * `subscription.trialEligible` jadi false. Throw `ApiError` bila tidak layak
   * (mis. email belum terverifikasi / sudah pernah klaim).
   */
  claimTrial: () => Promise<UserSubscription>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SubscriptionContext =
  createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const loadUsage = useCallback(async () => {
    try {
      const u = await subscriptionService.fetchMyUsage();
      setUsage(u);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, u] = await Promise.all([
        subscriptionService.fetchPlans(),
        subscriptionService.fetchMySubscription(),
        subscriptionService.fetchMyUsage(),
      ]);
      setPlans(p);
      setSubscription(s);
      setUsage(u);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      setPlans([]);
      setSubscription(null);
      setUsage(null);
      return;
    }
    void loadAll();
  }, [isAuthenticated, isBootstrapping, loadAll]);

  // Refetch usage saat tx/book/account/saving berubah supaya banner kuota
  // selalu segar.
  useEffect(() => {
    if (!isAuthenticated) return;
    const offTx = eventBus.on("transaction:changed", () => void loadUsage());
    const offBook = eventBus.on("book:changed", () => void loadUsage());
    const offAcc = eventBus.on("account:changed", () => void loadUsage());
    const offSav = eventBus.on("saving:changed", () => void loadUsage());
    const offSub = eventBus.on("subscription:changed", () => void loadAll());
    return () => {
      offTx();
      offBook();
      offAcc();
      offSav();
      offSub();
    };
  }, [isAuthenticated, loadUsage, loadAll]);

  const change = useCallback(
    async (
      tier: Exclude<PlanTier, "business">,
      paymentMethod?: PaymentMethodId,
    ) => {
      const res = await subscriptionService.changeSubscription({
        tier,
        paymentMethod,
      });
      // Saat checkout disertakan, tier BELUM benar-benar berubah (menunggu
      // webhook payment success). Update state apa adanya — caller (page)
      // bertanggung jawab redirect ke `checkout.checkoutUrl`.
      setSubscription(res.subscription);
      await loadUsage();
      return res;
    },
    [loadUsage],
  );

  const cancel = useCallback(async () => {
    const next = await subscriptionService.cancelSubscription();
    setSubscription(next);
    return next;
  }, []);

  const claimTrial = useCallback(async () => {
    const next = await subscriptionService.claimTrial();
    setSubscription(next);
    await loadUsage();
    return next;
  }, [loadUsage]);

  const currentPlan = useMemo<SubscriptionPlan | null>(() => {
    if (!subscription || plans.length === 0) return null;
    return plans.find((p) => p.tier === subscription.tier) ?? null;
  }, [plans, subscription]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      plans,
      subscription,
      usage,
      currentPlan,
      isLoading,
      error,
      refetch: loadAll,
      refetchUsage: loadUsage,
      change,
      cancel,
      claimTrial,
    }),
    [plans, subscription, usage, currentPlan, isLoading, error, loadAll, loadUsage, change, cancel, claimTrial],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
