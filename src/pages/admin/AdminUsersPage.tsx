import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { Section } from "@dep/ui/card";
import { Modal } from "@dep/ui/modal";
import { FormField, Input } from "@dep/ui/form";
import { Select } from "@dep/ui/select";
import { LoadingSpinner } from "@dep/ui/loading";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as adminService from "@/services/admin.service";
import { ModalShell } from "@/components/common/ModalShell";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/types";
import type {
  AdminLevel,
  AdminUser,
  AdminUserListPage,
  PlanTier,
} from "@/types";

const TIER_OPTIONS: Array<{ value: PlanTier; label: string }> = [
  { value: "free", label: "Gratis" },
  { value: "personal", label: "Personal" },
  { value: "premium", label: "Premium" },
  { value: "business", label: "Bisnis" },
];

const TIER_BADGE: Record<PlanTier, string> = {
  free: "bg-neutral-100 text-neutral-700",
  personal: "bg-blue-100 text-blue-700",
  premium: "bg-violet-100 text-violet-700",
  business: "bg-amber-100 text-amber-800",
};

const TIER_LABEL: Record<PlanTier, string> = {
  free: "Gratis",
  personal: "Personal",
  premium: "Premium",
  business: "Bisnis",
};

const ADMIN_LEVEL_OPTIONS: Array<{ value: AdminLevel | "none"; label: string }> = [
  { value: "none", label: "Bukan admin" },
  { value: "readonly", label: "Read-only" },
  { value: "support", label: "Support" },
  { value: "super", label: "Super admin" },
];

const PAGE_SIZE = 25;

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSuper = me?.adminLevel === "super";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<AdminUserListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [tierEditing, setTierEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.fetchAdminUsers({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleLock = async (u: AdminUser) => {
    const willLock = !u.locked;
    const ok = await confirm({
      title: willLock
        ? `Bekukan akun ${u.name}?`
        : `Aktifkan kembali ${u.name}?`,
      message: willLock
        ? "User tidak akan bisa login. Data tetap aman dan bisa di-unfreeze kapan saja."
        : "User bisa login lagi mulai sekarang.",
      confirmLabel: willLock ? "Bekukan" : "Aktifkan",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(
        adminService.patchAdminUser(u._id, { locked: willLock }),
        {
          loading: willLock ? "Membekukan…" : "Mengaktifkan…",
          success: willLock ? "Akun dibekukan ✓" : "Akun aktif kembali ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      void load();
    } catch {
      // surfaced
    }
  };

  const handleDelete = async (u: AdminUser) => {
    const ok = await confirm({
      title: `Hapus ${u.name}?`,
      message:
        "Akun akan dihapus permanen (soft-delete di DB). Cascade tidak dilakukan; data lama tetap di-preserve tapi user tidak bisa login. Hubungi DBA bila ingin restore.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(adminService.deleteAdminUser(u._id), {
        loading: "Menghapus…",
        success: "User dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      void load();
    } catch {
      // surfaced
    }
  };

  const handleMarkOnboarded = async (u: AdminUser) => {
    const ok = await confirm({
      title: `Tandai ${u.name} sudah onboarding?`,
      message:
        "User akan langsung diarahkan ke dashboard tanpa wizard onboarding pada login berikutnya.",
      confirmLabel: "Tandai aktif",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(
        adminService.patchAdminUser(u._id, {
          onboardedAt: new Date().toISOString(),
        }),
        {
          loading: "Menyimpan…",
          success: "User ditandai sudah onboarding ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      void load();
    } catch {
      // surfaced
    }
  };

  const handleResetPassword = async (u: AdminUser) => {
    const ok = await confirm({
      title: `Kirim email reset password ke ${u.email}?`,
      message:
        "User akan menerima email berisi link reset password yang berlaku 1 jam.",
      confirmLabel: "Kirim",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(adminService.forceResetUserPassword(u._id), {
        loading: "Mengirim email…",
        success: "Email reset terkirim ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
    } catch {
      // surfaced
    }
  };

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
        <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
        <p className="text-sm text-neutral-500">
          Cari, edit, atau reset password user. Aksi sensitif perlu level
          <span className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
            super
          </span>
          .
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari email atau nama…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-neutral-500">
          {data ? `${data.meta.total} user` : "—"}
        </p>
        <Button
          size="sm"
          leftIcon={<UserPlus size={14} />}
          disabled={!isSuper}
          onClick={() => setCreating(true)}
          title={isSuper ? "Buat user baru" : "Butuh level super"}
        >
          Buat User
        </Button>
      </div>

      <Section title="Daftar User" icon={<UserCog size={16} />}>
        {loading && !data ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            Tidak ada user yang cocok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama / Email</th>
                  <th className="px-4 py-2 font-medium">Tier</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Bergabung</th>
                  <th className="px-4 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.data.map((u) => (
                  <tr key={u._id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{u.name}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TIER_BADGE[u.tier]}`}
                      >
                        {TIER_LABEL[u.tier]}
                      </span>
                      {u.subscriptionStatus !== "active" && (
                        <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                          {u.subscriptionStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin(u) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <ShieldCheck size={10} /> Admin · {u.adminLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">User</span>
                      )}
                      {u.bypassQuota && (
                        <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          bypass-quota
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                          <Snowflake size={10} /> Beku
                        </span>
                      ) : u.onboardedAt ? (
                        <span className="text-emerald-700">Aktif</span>
                      ) : (
                        <button
                          type="button"
                          disabled={!isSuper}
                          onClick={() => void handleMarkOnboarded(u)}
                          title={
                            isSuper
                              ? "Tandai sudah onboarding"
                              : "Butuh level super"
                          }
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={10} /> Belum onboarding
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Mail size={12} />}
                          onClick={() => void handleResetPassword(u)}
                          title="Kirim email reset password"
                        >
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Sparkles size={12} />}
                          onClick={() => setTierEditing(u)}
                          disabled={!isSuper}
                          title={
                            isSuper
                              ? "Set subscription tier"
                              : "Butuh level super"
                          }
                        >
                          Tier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<UserCog size={12} />}
                          onClick={() => setEditing(u)}
                          disabled={!isSuper}
                          title={isSuper ? "Edit user" : "Butuh level super"}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={
                            u.locked ? <Sun size={12} /> : <Snowflake size={12} />
                          }
                          onClick={() => void handleToggleLock(u)}
                          disabled={!isSuper}
                          title={
                            u.locked ? "Aktifkan kembali" : "Bekukan akun"
                          }
                        >
                          {u.locked ? "Aktifkan" : "Bekukan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 size={12} />}
                          onClick={() => void handleDelete(u)}
                          disabled={!isSuper}
                          title="Hapus user"
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2 text-sm">
            <p className="text-xs text-neutral-500">
              Hal {data.meta.page} dari {data.meta.totalPages}
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

      <EditUserModal
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
      <SetTierModal
        target={tierEditing}
        onClose={() => setTierEditing(null)}
        onSaved={() => {
          setTierEditing(null);
          void load();
        }}
      />
      <CreateUserModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          void load();
        }}
      />
    </div>
  );
};

// ── Create User Modal ─────────────────────────────────────────────────────────

interface CreateUserFormValues {
  email: string;
  name: string;
  password: string;
  adminLevel: AdminLevel | "none";
  bypassQuota: boolean;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const form = useForm<CreateUserFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      adminLevel: "none",
      bypassQuota: false,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await notify.promise(
        adminService.createAdminUser({
          email: data.email.trim(),
          name: data.name.trim(),
          password: data.password.trim() || undefined,
          adminLevel: data.adminLevel === "none" ? undefined : data.adminLevel,
          bypassQuota: data.bypassQuota,
        }),
        {
          loading: "Membuat user…",
          success: data.password
            ? "User dibuat ✓"
            : "User dibuat ✓ Email reset password terkirim.",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      form.reset();
      onCreated();
    } catch {
      // surfaced
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Plus size={20} className="text-emerald-600" />}
          title="Buat User Baru"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Buat
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <FormField label="Email" required>
              <Input
                type="email"
                placeholder="user@example.com"
                {...form.register("email", { required: true })}
              />
            </FormField>
            <FormField label="Nama" required>
              <Input
                placeholder="Nama lengkap"
                {...form.register("name", { required: true })}
              />
            </FormField>
            <FormField label="Password (opsional)">
              <Input
                type="text"
                placeholder="Kosongkan = kirim email reset ke user"
                {...form.register("password")}
              />
            </FormField>
            <FormField label="Level Admin">
              <Select
                value={ADMIN_LEVEL_OPTIONS.find(
                  (o) => o.value === form.watch("adminLevel"),
                )}
                options={ADMIN_LEVEL_OPTIONS}
                onChange={(opt) =>
                  opt &&
                  form.setValue(
                    "adminLevel",
                    opt.value as AdminLevel | "none",
                  )
                }
                isClearable={false}
              />
            </FormField>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("bypassQuota")}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-neutral-800">
                  Bypass quota
                </span>
                <span className="block text-xs text-neutral-500">
                  Lewati semua batas plan. Direkomendasikan untuk akun admin
                  internal.
                </span>
              </span>
            </label>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────

interface EditUserFormValues {
  name: string;
  adminLevel: AdminLevel | "none";
  bypassQuota: boolean;
}

interface EditUserModalProps {
  target: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditUserModal({ target, onClose, onSaved }: EditUserModalProps) {
  const form = useForm<EditUserFormValues>({
    values: {
      name: target?.name ?? "",
      adminLevel: target?.adminLevel ?? "none",
      bypassQuota: !!target?.bypassQuota,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (!target) return;
    try {
      await notify.promise(
        adminService.patchAdminUser(target._id, {
          name: data.name,
          adminLevel: data.adminLevel === "none" ? null : data.adminLevel,
          bypassQuota: data.bypassQuota,
          roles: data.adminLevel === "none" ? [] : ["admin"],
        }),
        {
          loading: "Menyimpan…",
          success: "User diperbarui ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      onSaved();
    } catch {
      // surfaced
    }
  });

  return (
    <Modal isOpen={!!target} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<UserCog size={20} className="text-emerald-600" />}
          title={`Edit ${target?.name ?? ""}`}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Simpan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="rounded bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              {target?.email}
            </p>
            <FormField label="Nama" required>
              <Input {...form.register("name", { required: true })} />
            </FormField>
            <FormField label="Level Admin">
              <Select
                value={ADMIN_LEVEL_OPTIONS.find(
                  (o) => o.value === form.watch("adminLevel"),
                )}
                options={ADMIN_LEVEL_OPTIONS}
                onChange={(opt) =>
                  opt &&
                  form.setValue(
                    "adminLevel",
                    opt.value as AdminLevel | "none",
                  )
                }
                isClearable={false}
              />
            </FormField>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("bypassQuota")}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-neutral-800">
                  Bypass semua quota
                </span>
                <span className="block text-xs text-neutral-500">
                  Lewati semua batas plan (transaksi, dompet, anggota, dst).
                  Direkomendasikan untuk admin internal.
                </span>
              </span>
            </label>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

// ── Set Subscription Tier Modal ───────────────────────────────────────────────

interface SetTierFormValues {
  tier: PlanTier;
  months: number;
}

function SetTierModal({ target, onClose, onSaved }: EditUserModalProps) {
  const form = useForm<SetTierFormValues>({
    values: { tier: "free", months: 1 },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (!target) return;
    // Periode kelipatan 30 hari; tier free tidak punya periode.
    const periodDays =
      data.tier === "free" ? undefined : Math.max(1, data.months) * 30;
    try {
      await notify.promise(
        adminService.setUserSubscription(target._id, {
          tier: data.tier,
          periodDays,
        }),
        {
          loading: "Menyimpan…",
          success: "Subscription diperbarui ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      onSaved();
    } catch {
      // surfaced
    }
  });

  const watchedTier = form.watch("tier");
  const tierOption = useMemo(
    () => TIER_OPTIONS.find((o) => o.value === watchedTier),
    [watchedTier],
  );

  return (
    <Modal isOpen={!!target} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Sparkles size={20} className="text-amber-500" />}
          title={`Set Tier — ${target?.name ?? ""}`}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Simpan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Admin tier-set: bypass payment + boleh set ke{" "}
              <strong>Bisnis</strong>. Aksi ini ter-audit.
            </p>
            <FormField label="Tier" required>
              <Select
                value={tierOption}
                options={TIER_OPTIONS}
                onChange={(opt) =>
                  opt && form.setValue("tier", opt.value as PlanTier)
                }
                isClearable={false}
              />
            </FormField>
            {watchedTier !== "free" && (
              <FormField label="Periode (bulan)">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  {...form.register("months", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Masa berlaku = jumlah bulan × 30 hari.
                </p>
              </FormField>
            )}
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

export default AdminUsersPage;
