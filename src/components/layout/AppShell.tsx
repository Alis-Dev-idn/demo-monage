import { useEffect, useMemo, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Book,
  CalendarRange,
  KeyRound,
  Layers,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  UserCircle2,
  Wallet,
  PiggyBank,
  Tag,
  Ruler,
  BarChart3,
  Home,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  ScrollText,
} from "lucide-react";
import {
  DashboardKit,
  DashboardLayout,
  useDashboard,
} from "@dep/templates/dashboard";
import type { SidebarSectionConfig } from "@dep/templates/dashboard";
import { confirm } from "@dep/ui/confirm";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useRealtime } from "@/lib/realtime/useRealtime";
import { BookSwitcher } from "@/components/books/BookSwitcher";
import { DemoBanner } from "@/components/organisms/demo/DemoBanner";
import { InAppPersonaSwitcher } from "@/components/organisms/demo/InAppPersonaSwitcher";
import { isAdmin } from "@/types";

interface AppShellProps {
  children?: ReactNode;
}

/**
 * Sub-komponen yang HARUS dirender di dalam `<DashboardLayout>` agar memiliki
 * akses ke `useDashboard()`. Tugasnya:
 *   1. Sinkronkan `user` dari AuthContext ke Dashboard context (lewat setUser).
 *   2. Update `profileMenu` di DashboardKit (NavbarUser membaca lewat
 *      `DashboardKit.getConfig()` setiap render — perubahan ter-pickup).
 *   3. Update `sidebar.sections` per perubahan active book → label section
 *      "Pembukuan: <name>" mengikuti pilihan aktif.
 */
function ChromeSync({
  onLogout,
}: {
  onLogout: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const { activeBook } = useBooks();
  const { setUser } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();

  // Guard peran kasir (#3): kasir hanya boleh akses Kasir/POS, Penjualan, dan
  // Profil/Pengaturan. Selain itu (mis. Beranda, Transaksi, Dompet) diarahkan
  // ke POS — mencegah kasir membuka menu yang bukan haknya, juga saat awal login.
  const isCashier = activeBook?.kind === "business" && activeBook?.myRole === "cashier";
  useEffect(() => {
    if (!isCashier) return;
    const allowed = [
      "/dashboard/pos",
      "/dashboard/sales",
      "/dashboard/settings",
    ];
    if (!allowed.some((p) => location.pathname.startsWith(p))) {
      navigate("/dashboard/pos", { replace: true });
    }
  }, [isCashier, location.pathname, navigate]);

  useEffect(() => {
    if (!user) {
      setUser(undefined);
      return;
    }
    setUser({
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      role: "Pengguna",
    });
  }, [user, setUser]);

  // Satu effect membangun profileMenu + sidebar.sections dalam SATU
  // `DashboardKit.setup` agar tidak ada race antar-effect yang saling menimpa
  // sections (menyebabkan menu "satu langkah di belakang" saat ganti pembukuan).
  useEffect(() => {
    const bookLabel = activeBook ? `Pembukuan: ${activeBook.name}` : "Pembukuan";
    const isBusiness = activeBook?.kind === "business";
    const isCashier = activeBook?.myRole === "cashier";

    const sections: SidebarSectionConfig[] = [];

    if (isBusiness) {
      // Kasir (cashier) hanya melihat POS + Penjualan (struk miliknya).
      const businessItems = isCashier
        ? [
            { label: "Kasir (POS)", icon: <ShoppingCart size={16} />, path: "/dashboard/pos" },
            { label: "Penjualan", icon: <ScrollText size={16} />, path: "/dashboard/sales" },
          ]
        : [
            { label: "Kasir (POS)", icon: <ShoppingCart size={16} />, path: "/dashboard/pos" },
            { label: "Penjualan", icon: <ScrollText size={16} />, path: "/dashboard/sales" },
            { label: "Produk & Stok", icon: <Package size={16} />, path: "/dashboard/products" },
            { label: "Dompet", icon: <Wallet size={16} />, path: "/dashboard/accounts" },
            { label: "Transfer Antar-Pembukuan", icon: <ArrowLeftRight size={16} />, path: "/dashboard/transfers" },
            { label: "Laporan & Laba/Rugi", icon: <BarChart3 size={16} />, path: "/dashboard/business-report" },
            { label: "Audit", icon: <ShieldCheck size={16} />, path: "/dashboard/audit" },
            { label: "Pengaturan Bisnis", icon: <Settings size={16} />, path: "/dashboard/business-settings" },
          ];

      if (!isCashier) {
        sections.push({
          id: "primary",
          items: [
            { label: "Beranda", icon: <Home size={16} />, path: "/dashboard/beranda" },
          ],
        });
      }
      sections.push({
        id: "business-scoped",
        label: bookLabel,
        items: businessItems,
      });
      if (!isCashier) {
        sections.push({
          id: "global",
          label: "Lainnya",
          items: [
            { label: "Pembukuan", icon: <Book size={16} />, path: "/dashboard/books" },
            { label: "Pengaturan", icon: <Layers size={16} />, path: "/dashboard/settings" },
          ],
        });
      }
    } else {
      sections.push(
        {
          id: "primary",
          items: [
            { label: "Beranda", icon: <Home size={16} />, path: "/dashboard/beranda" },
          ],
        },
        {
          id: "book-scoped",
          label: bookLabel,
          items: [
            { label: "Transaksi", icon: <Receipt size={16} />, path: "/dashboard/transactions" },
            { label: "Dompet", icon: <Wallet size={16} />, path: "/dashboard/accounts" },
            { label: "Tabungan", icon: <PiggyBank size={16} />, path: "/dashboard/savings" },
            { label: "Kategori", icon: <Tag size={16} />, path: "/dashboard/categories" },
            { label: "Anggaran", icon: <Ruler size={16} />, path: "/dashboard/budget" },
            { label: "Perencanaan Bulanan", icon: <CalendarRange size={16} />, path: "/dashboard/monthly-plan" },
            { label: "Laporan", icon: <BarChart3 size={16} />, path: "/dashboard/reports" },
          ],
        },
        {
          id: "global",
          label: "Lainnya",
          items: [
            { label: "Pembukuan", icon: <Book size={16} />, path: "/dashboard/books" },
            { label: "Pengaturan", icon: <Layers size={16} />, path: "/dashboard/settings" },
          ],
        },
      );
    }

    if (!isCashier && isAdmin(user)) {
      sections.push({
        id: "admin",
        label: "Admin",
        items: [
          { label: "Admin Panel", icon: <ShieldCheck size={16} />, path: "/dashboard/admin" },
        ],
      });
    }

    DashboardKit.setup({
      ...DashboardKit.getConfig(),
      profileMenu: [
        {
          label: "Profil",
          icon: <UserCircle2 size={14} />,
          onClick: () => navigate("/dashboard/settings/profile"),
        },
        {
          label: "Pengaturan",
          icon: <Settings size={14} />,
          onClick: () => navigate("/dashboard/settings"),
        },
        {
          label: "Ubah Kata Sandi",
          icon: <KeyRound size={14} />,
          onClick: () => navigate("/dashboard/settings/profile"),
        },
        {
          label: "Keluar",
          variant: "danger",
          icon: <LogOut size={14} />,
          onClick: () => void onLogout(),
        },
      ],
      sidebar: {
        ...(DashboardKit.getConfig().sidebar ?? {}),
        sections,
      },
    });
  }, [activeBook, user, navigate, onLogout]);

  return null;
}

export function AppShell({ children }: AppShellProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useRealtime();

  const handleLogout = useMemo(
    () => async () => {
      const ok = await confirm({
        title: "Keluar dari Monage?",
        message: "Anda harus login lagi untuk mengakses data Anda.",
        confirmLabel: "Keluar",
        cancelLabel: "Batal",
      });
      if (!ok) return;
      await logout();
      navigate("/auth", { replace: true });
    },
    [logout, navigate],
  );

  // Footer sidebar — switcher pembukuan di atas, tombol Logout di bawah.
  const sidebarFooter = useMemo(
    () => (
      <div className="space-y-2">
        <InAppPersonaSwitcher />
        <BookSwitcher />
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    ),
    [handleLogout],
  );

  // Set footer via DashboardKit (Sidebar membaca dari config setiap render).
  useEffect(() => {
    DashboardKit.setup({
      ...DashboardKit.getConfig(),
      sidebar: {
        ...(DashboardKit.getConfig().sidebar ?? {}),
        footer: sidebarFooter,
      },
    });
  }, [sidebarFooter]);

  return (
    <DashboardLayout>
      <ChromeSync onLogout={handleLogout} />
      <DemoBanner />
      {children}
    </DashboardLayout>
  );
}
