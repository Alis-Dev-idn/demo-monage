import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Crown,
  History,
  Mail,
  Send,
  Trash2,
  UserCircle2,
  UserMinus,
  Users,
  Zap,
} from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { Select, type SelectOption } from "@dep/ui/select";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useNavigate } from "react-router-dom";
import { ModalShell } from "@/components/common/ModalShell";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/hooks/useBookPermission";
import { useMemberQuota, useSubscription } from "@/hooks/useSubscription";
import * as bookService from "@/services/book.service";
import { eventBus } from "@/utils/eventBus";
import { formatRelativeTime } from "@/utils/format";
import type {
  Book,
  BookInvitation,
  BookMember,
  BookRole,
  BookShareActivity,
} from "@/types";

function describeActivity(a: BookShareActivity): string {
  const who = a.actorName;
  const target = a.targetName || a.targetEmail || "";
  const role = a.role ? ROLE_LABEL[a.role as BookRole] ?? a.role : "";
  switch (a.action) {
    case "invite_sent":
      return `${who} mengundang ${target}${role ? ` sebagai ${role}` : ""}`;
    case "invite_revoked":
      return `${who} mencabut undangan ${target}`;
    case "invite_accepted":
      return `${target || who} menerima undangan`;
    case "invite_declined":
      return `${target || who} menolak undangan`;
    case "role_changed":
      return `${who} mengubah peran ${target} menjadi ${role}`;
    case "member_removed":
      return `${who} mengeluarkan ${target}`;
    case "member_left":
      return `${target || who} keluar dari pembukuan`;
    default:
      return `${who} melakukan perubahan`;
  }
}

interface BookMembersModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: SelectOption<BookRole>[] = [
  { value: "editor", label: ROLE_LABEL.editor },
  { value: "viewer", label: ROLE_LABEL.viewer },
];

// Pembukuan bisnis (v1.3) menambah opsi "Kasir".
const BUSINESS_ROLE_OPTIONS: SelectOption<BookRole>[] = [
  ...ROLE_OPTIONS,
  { value: "cashier", label: ROLE_LABEL.cashier },
];

export function BookMembersModal({ book, isOpen, onClose }: BookMembersModalProps) {
  const navigate = useNavigate();
  const memberQuota = useMemberQuota(book?._id);
  const { refetchUsage } = useSubscription();
  const [members, setMembers] = useState<BookMember[]>([]);
  const [invitations, setInvitations] = useState<BookInvitation[]>([]);
  const [history, setHistory] = useState<BookShareActivity[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<BookRole>("editor");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opsi role — pembukuan bisnis menambah "Kasir".
  const roleOptions =
    book?.kind === "business" ? BUSINESS_ROLE_OPTIONS : ROLE_OPTIONS;

  const loadHistory = useCallback(async () => {
    if (!book) return;
    try {
      setHistory(await bookService.fetchBookShareHistory(book._id));
    } catch {
      // riwayat opsional — abaikan kegagalan
    }
  }, [book]);

  const load = useCallback(async () => {
    if (!book) return;
    setLoading(true);
    try {
      const [m, inv, hist] = await Promise.all([
        bookService.fetchBookMembers(book._id),
        bookService.fetchBookInvitations(book._id),
        bookService.fetchBookShareHistory(book._id).catch(() => []),
      ]);
      setMembers(m);
      setInvitations(inv.filter((i) => i.status === "pending"));
      setHistory(hist);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) void load();
  }, [isOpen, load]);

  if (!book) return null;

  const isOwner = book.isOwner;

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      notify.warning("Email tidak valid");
      return;
    }
    setBusy(true);
    try {
      const inv = await notify.promise(
        bookService.inviteBookMember(book._id, { email: inviteEmail, role: inviteRole }),
        {
          loading: "Mengirim undangan…",
          success: "Undangan terkirim ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal mengirim."),
        },
      );
      setInviteEmail("");
      setInvitations((prev) => [inv, ...prev]);
      void refetchUsage();
      void loadHistory();
    } catch (err) {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        // Tutup modal anggota lalu arahkan ke halaman langganan.
        onClose();
        navigate("/dashboard/settings/subscription");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (m: BookMember, role: BookRole) => {
    try {
      const updated = await bookService.updateBookMemberRole(book._id, m._id, role);
      setMembers((prev) => prev.map((x) => (x._id === m._id ? updated : x)));
      notify.success(`Role ${m.name} diubah ke ${ROLE_LABEL[role]}`);
      void loadHistory();
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    }
  };

  const handleRemove = async (m: BookMember) => {
    const ok = await confirm({
      title: `Keluarkan ${m.name}?`,
      message: `${m.name} tidak lagi punya akses ke pembukuan "${book.name}".`,
      confirmLabel: "Keluarkan",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(bookService.removeBookMember(book._id, m._id), {
        loading: "Mengeluarkan…",
        success: `${m.name} dikeluarkan ✓`,
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      setMembers((prev) => prev.filter((x) => x._id !== m._id));
      eventBus.emit("subscription:changed");
      void loadHistory();
    } catch {
      // surfaced
    }
  };

  const handleRevoke = async (inv: BookInvitation) => {
    try {
      await notify.promise(bookService.revokeBookInvitation(book._id, inv._id), {
        loading: "Mencabut undangan…",
        success: "Undangan dicabut ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      setInvitations((prev) => prev.filter((i) => i._id !== inv._id));
      void refetchUsage();
      void loadHistory();
    } catch {
      // surfaced
    }
  };

  const copyInvitationLink = async (inv: BookInvitation) => {
    const url = `${window.location.origin}/invitations/accept?token=${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      notify.success("Link disalin ✓");
    } catch {
      notify.error("Gagal salin — copy manual: " + url);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalShell
        icon={<Users size={20} />}
        title={`Anggota "${book.name}"`}
        subtitle={`${members.length} anggota${invitations.length ? ` · ${invitations.length} undangan menunggu` : ""}`}
        footer={
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
        }
      >
        <div className="space-y-5">
          {isOwner && memberQuota.isNearLimit && (
            <div
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                memberQuota.isAtLimit
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {memberQuota.isAtLimit
                    ? `Kuota anggota habis (${memberQuota.used}/${memberQuota.limit})`
                    : `Kuota anggota ${memberQuota.percentUsed}% (${memberQuota.used}/${memberQuota.limit})`}
                </p>
                <p className="text-xs opacity-80">
                  {memberQuota.isAtLimit
                    ? "Cabut undangan pending atau upgrade paket untuk mengundang anggota baru."
                    : "Mendekati batas anggota di paket Anda."}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Zap size={12} />}
                onClick={() => navigate("/dashboard/settings/subscription")}
              >
                Upgrade
              </Button>
            </div>
          )}

          {isOwner && (
            <section className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="text-sm font-semibold text-neutral-800">
                Undang anggota baru
                {memberQuota.limit !== null && (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    ({memberQuota.used}/{memberQuota.limit} terpakai)
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-500">
                Anggota akan dapat email berisi link untuk gabung. Sambil
                menunggu, Anda juga bisa copy link manual.
              </p>
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                <FormField label="Email" htmlFor="invite-email">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="rekan@example.com"
                    leftAddon={<Mail size={14} />}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="Role">
                  <Select<BookRole>
                    value={roleOptions.find((o) => o.value === inviteRole)}
                    options={roleOptions}
                    onChange={(opt) => opt && setInviteRole(opt.value)}
                    isClearable={false}
                  />
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    leftIcon={<Send size={14} />}
                    onClick={() => void handleInvite()}
                    isLoading={busy}
                    disabled={memberQuota.isAtLimit}
                  >
                    Kirim
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                <strong>{ROLE_LABEL[inviteRole]}</strong>: {ROLE_DESCRIPTION[inviteRole]}
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-neutral-800">
              Anggota aktif
            </h3>
            {loading && members.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 p-3 text-center text-sm text-neutral-500">
                Memuat…
              </p>
            ) : members.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 p-3 text-center text-sm text-neutral-500">
                Belum ada anggota.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {members.map((m) => (
                  <li
                    key={m._id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle2 size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-medium text-neutral-900">
                        {m.name}
                        {m.role === "owner" && (
                          <Crown size={12} className="text-amber-500" aria-hidden />
                        )}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{m.email}</p>
                    </div>
                    {isOwner && m.role !== "owner" ? (
                      <>
                        <Select<BookRole>
                          value={roleOptions.find((o) => o.value === m.role)}
                          options={roleOptions}
                          onChange={(opt) => opt && void handleRoleChange(m, opt.value)}
                          isClearable={false}
                        />
                        <button
                          type="button"
                          aria-label={`Keluarkan ${m.name}`}
                          onClick={() => void handleRemove(m)}
                          className="rounded-md p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <UserMinus size={14} />
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        {ROLE_LABEL[m.role]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isOwner && invitations.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-neutral-800">
                Undangan menunggu
              </h3>
              <ul className="space-y-1.5">
                {invitations.map((inv) => (
                  <li
                    key={inv._id}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2"
                  >
                    <Mail size={16} className="text-amber-700" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {inv.email}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {ROLE_LABEL[inv.role]} · Dikirim {formatRelativeTime(inv.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Salin link undangan"
                      onClick={() => void copyInvitationLink(inv)}
                      className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white hover:text-emerald-700"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Cabut undangan"
                      onClick={() => void handleRevoke(inv)}
                      className="rounded-md p-1.5 text-neutral-500 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {history.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                <History size={14} /> Riwayat Berbagi
              </h3>
              <ul className="space-y-1">
                {history.map((a) => (
                  <li
                    key={a._id}
                    className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-neutral-700">{describeActivity(a)}</p>
                      <p className="text-[11px] text-neutral-400">
                        {formatRelativeTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </ModalShell>
    </Modal>
  );
}
