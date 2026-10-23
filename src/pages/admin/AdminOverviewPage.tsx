import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Server, Sparkles, Tag, Users } from "lucide-react";
import { Section, InfoBox } from "@dep/ui/card";
import { LoadingSpinner } from "@dep/ui/loading";
import { ApiError } from "@dep/axios";
import { notify } from "@dep/notify";
import * as adminService from "@/services/admin.service";
import { useAuth } from "@/hooks/useAuth";
import type {
  AdminSubscriptionStats,
  AdminSystemHealth,
  PlanTier,
} from "@/types";

const TIER_LABEL: Record<PlanTier, string> = {
  free: "Gratis",
  personal: "Personal",
  premium: "Premium",
  business: "Bisnis",
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}h ${h}j ${m}m`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

const AdminOverviewPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminSubscriptionStats | null>(null);
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [s, h] = await Promise.all([
          adminService.fetchSubscriptionStats(),
          adminService.fetchAdminSystemHealth(),
        ]);
        if (!alive) return;
        setStats(s);
        setHealth(h);
      } catch (err) {
        if (alive && err instanceof ApiError) notify.error(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading && !stats && !health) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Admin Panel</h1>
        <p className="text-sm text-neutral-500">
          Selamat datang, {user?.name} · level{" "}
          <span className="font-medium text-neutral-700">
            {user?.adminLevel ?? "—"}
          </span>
        </p>
      </header>

      <Section title="Statistik Langganan" icon={<Sparkles size={16} />}>
        {stats ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total User" value={stats.total} highlight />
            {(Object.keys(TIER_LABEL) as PlanTier[]).map((t) => (
              <StatCard
                key={t}
                label={TIER_LABEL[t]}
                value={stats.counts[t] ?? 0}
              />
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-neutral-500">Tidak ada data.</p>
        )}
      </Section>

      <Section title="System Health" icon={<Server size={16} />}>
        {health ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Status" value={health.status.toUpperCase()} />
            <StatCard label="Uptime" value={formatUptime(health.uptime)} />
            <StatCard label="Node" value={health.nodeVersion} />
            <StatCard label="Env" value={health.env} />
          </div>
        ) : (
          <p className="p-4 text-sm text-neutral-500">Health probe gagal.</p>
        )}
      </Section>

      <Section title="Aksi Cepat" icon={<Activity size={16} />}>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Link
            to="/dashboard/admin/users"
            className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition hover:bg-neutral-50"
          >
            <Users size={20} className="mt-0.5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Manajemen User
              </p>
              <p className="text-xs text-neutral-500">
                Buat, edit, freeze, atau hapus user. Reset password & set tier.
              </p>
            </div>
          </Link>
          <Link
            to="/dashboard/admin/plans"
            className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition hover:bg-neutral-50"
          >
            <Tag size={20} className="mt-0.5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Plan Catalog
              </p>
              <p className="text-xs text-neutral-500">
                Atur harga, quota, & highlight tiap paket tanpa redeploy.
              </p>
            </div>
          </Link>
          <Link
            to="/dashboard/admin/audit"
            className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition hover:bg-neutral-50"
          >
            <Activity size={20} className="mt-0.5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Audit Log
              </p>
              <p className="text-xs text-neutral-500">
                Riwayat semua aksi admin (retensi 1 tahun).
              </p>
            </div>
          </Link>
        </div>
      </Section>

      {user?.adminLevel !== "super" && (
        <InfoBox
          variant="info"
          title="Akses terbatas"
          description={`Level "${user?.adminLevel}" tidak bisa edit user / set tier / impersonate. Hubungi super-admin.`}
        />
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "border-emerald-300 bg-emerald-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export default AdminOverviewPage;
