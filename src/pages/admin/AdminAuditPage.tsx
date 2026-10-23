import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Activity, Filter, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { Section } from "@dep/ui/card";
import { FormField, Input } from "@dep/ui/form";
import { Select } from "@dep/ui/select";
import { LoadingSpinner } from "@dep/ui/loading";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as adminService from "@/services/admin.service";
import type { AdminAuditEntry, AdminAuditPage } from "@/types";

const PAGE_SIZE = 50;

/**
 * Daftar action yang dikenal backend (sinkron dengan `admin.service.ts`).
 * Lebih ergonomis untuk admin yang tidak tahu nama action exact.
 */
const ACTION_OPTIONS = [
  { value: "", label: "Semua aksi" },
  { value: "user.patch", label: "Edit user" },
  { value: "user.reset_password", label: "Reset password" },
  { value: "user.impersonate", label: "Impersonate tier" },
  { value: "user.subscription.set", label: "Set subscription" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "", label: "Semua target" },
  { value: "user", label: "User" },
  { value: "plan", label: "Plan" },
  { value: "subscription", label: "Subscription" },
];

const ACTION_LABEL: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
);

interface Filters {
  action: string;
  targetType: string;
  actorEmail: string;
}

const AdminAuditPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    action: "",
    targetType: "",
    actorEmail: "",
  });
  const [data, setData] = useState<AdminAuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.fetchAdminAudit({
        page,
        size: PAGE_SIZE,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  // Free-text filter di sisi client (backend hanya support filter by action
  // dan targetType — actorEmail kita saring lokal supaya admin tidak perlu
  // tahu actorId yang berbentuk UUID).
  const visibleEntries = (data?.data ?? []).filter((e) => {
    const q = filters.actorEmail.trim().toLowerCase();
    if (!q) return true;
    return (
      e.actorEmail.toLowerCase().includes(q) ||
      (e.targetId ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/admin")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali ke Admin Panel
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Audit Log</h1>
        <p className="text-sm text-neutral-500">
          Riwayat semua aksi admin. Retensi 1 tahun (TTL otomatis).
        </p>
      </header>

      <Section title="Filter" icon={<Filter size={16} />}>
        <div className="grid gap-3 p-3 sm:grid-cols-3">
          <FormField label="Jenis Aksi">
            <Select
              value={ACTION_OPTIONS.find((o) => o.value === filters.action)}
              options={ACTION_OPTIONS}
              onChange={(opt) => {
                setFilters((f) => ({ ...f, action: opt?.value ?? "" }));
                setPage(1);
              }}
              isClearable={false}
            />
          </FormField>
          <FormField label="Target">
            <Select
              value={TARGET_TYPE_OPTIONS.find(
                (o) => o.value === filters.targetType,
              )}
              options={TARGET_TYPE_OPTIONS}
              onChange={(opt) => {
                setFilters((f) => ({ ...f, targetType: opt?.value ?? "" }));
                setPage(1);
              }}
              isClearable={false}
            />
          </FormField>
          <FormField label="Cari (email actor atau target ID)">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                value={filters.actorEmail}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, actorEmail: e.target.value }))
                }
                placeholder="admin@…"
                className="pl-9"
              />
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({ action: "", targetType: "", actorEmail: "" });
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      </Section>

      <Section title="Entry" icon={<Activity size={16} />}>
        {loading && !data ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !data || visibleEntries.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            Belum ada entry yang cocok.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {visibleEntries.map((e) => (
              <AuditEntryRow
                key={e._id}
                entry={e}
                expanded={expanded === e._id}
                onToggle={() =>
                  setExpanded((cur) => (cur === e._id ? null : e._id))
                }
              />
            ))}
          </ul>
        )}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2 text-sm">
            <p className="text-xs text-neutral-500">
              {data.meta.total} entry · hal {data.meta.page} /{" "}
              {data.meta.totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(data.meta.totalPages, p + 1))
                }
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

interface AuditEntryRowProps {
  entry: AdminAuditEntry;
  expanded: boolean;
  onToggle: () => void;
}

function AuditEntryRow({ entry, expanded, onToggle }: AuditEntryRowProps) {
  const hasPayload = entry.before || entry.after;
  return (
    <li className="px-4 py-3">
      <button
        type="button"
        onClick={hasPayload ? onToggle : undefined}
        className={`flex w-full items-start justify-between gap-3 text-left ${
          hasPayload ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-800">
              {ACTION_LABEL[entry.action] ?? entry.action}
            </span>
            <span className="text-xs text-neutral-500">
              → {entry.targetType}
              {entry.targetId && ` #${entry.targetId.slice(0, 8)}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-600">
            oleh <strong>{entry.actorEmail}</strong>{" "}
            <span className="text-neutral-400">({entry.actorLevel})</span>
            {entry.ip && ` · ${entry.ip}`}
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-neutral-500">
          {new Date(entry.occurredAt).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </button>
      {expanded && hasPayload && (
        <div className="mt-2 grid gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
          {entry.before && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                Before
              </p>
              <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-neutral-700">
                {JSON.stringify(entry.before, null, 2)}
              </pre>
            </div>
          )}
          {entry.after && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                After
              </p>
              <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-neutral-700">
                {JSON.stringify(entry.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default AdminAuditPage;
