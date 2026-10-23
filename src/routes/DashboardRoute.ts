import type { RouteConfig } from "@dep/route";
import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AdminGuard } from "@/components/auth/AdminGuard";

/**
 * Sidebar items NIENG di-set via `sidebar` meta di sini supaya tidak
 * auto-generate flat list. Sebagai gantinya, `AppShell` membangun sidebar
 * manual via `DashboardKit.setup({ sidebar: { sections } })` yang dikelompokkan
 * per pembukuan aktif.
 */
const dashboardRoutes: RouteConfig[] = [
  {
    path: "/dashboard",
    layout: AppShell,
    component: Outlet,
    breadcrumb: "Dashboard",
    auth: true,
    children: [
      {
        path: "",
        index: true,
        component: () => import("@pages/dashboard/DashboardPage"),
        breadcrumb: "Beranda",
      },
      {
        path: "beranda",
        component: () => import("@pages/dashboard/DashboardPage"),
        breadcrumb: "Beranda",
      },
      {
        path: "transactions",
        component: () => import("@pages/dashboard/TransactionsPage"),
        breadcrumb: "Transaksi",
      },
      {
        path: "transactions/new",
        component: () => import("@pages/dashboard/TransactionNewPage"),
        breadcrumb: "Catat Transaksi",
      },
      {
        path: "accounts",
        component: () => import("@pages/dashboard/AccountsPage"),
        breadcrumb: "Dompet",
      },
      {
        path: "accounts/:id",
        component: () => import("@pages/dashboard/AccountDetailPage"),
        breadcrumb: "Detail Dompet",
      },
      {
        path: "savings",
        component: () => import("@pages/dashboard/SavingsPage"),
        breadcrumb: "Tabungan",
      },
      {
        path: "savings/:id",
        component: () => import("@pages/dashboard/SavingDetailPage"),
        breadcrumb: "Detail Tabungan",
      },
      {
        path: "categories",
        component: () => import("@pages/dashboard/CategoriesPage"),
        breadcrumb: "Kategori",
      },
      {
        path: "budget",
        component: () => import("@pages/dashboard/BudgetPage"),
        breadcrumb: "Anggaran",
      },
      {
        path: "reports",
        component: () => import("@pages/dashboard/ReportsPage"),
        breadcrumb: "Laporan",
      },
      {
        path: "settings",
        component: () => import("@pages/dashboard/SettingsPage"),
        breadcrumb: "Pengaturan",
      },
      {
        path: "settings/profile",
        component: () => import("@pages/dashboard/ProfilePage"),
        breadcrumb: "Profil",
      },
      {
        path: "settings/subscription",
        component: () => import("@pages/dashboard/SubscriptionPage"),
        breadcrumb: "Langganan",
      },
      {
        // Landing setelah user kembali dari hosted checkout payment gateway.
        // Gateway redirect ke `${FRONTEND_URL}/dashboard/subscription/result
        // ?status=success|pending|failed&sessionId=xxx&tier=premium`.
        path: "subscription/result",
        component: () => import("@pages/dashboard/SubscriptionResultPage"),
        breadcrumb: "Hasil Pembayaran",
      },
      {
        path: "books",
        component: () => import("@pages/dashboard/BooksPage"),
        breadcrumb: "Pembukuan",
      },
      {
        path: "monthly-plan",
        component: () => import("@pages/dashboard/MonthlyPlanPage"),
        breadcrumb: "Perencanaan Bulanan",
      },
      // ── Pembukuan Bisnis (v1.3) ──────────────────────────────────────────
      {
        path: "pos",
        component: () => import("@pages/dashboard/business/PosPage"),
        breadcrumb: "Kasir (POS)",
      },
      {
        path: "products",
        component: () => import("@pages/dashboard/business/ProductsPage"),
        breadcrumb: "Produk & Stok",
      },
      {
        path: "products/new",
        component: () => import("@pages/dashboard/business/ProductEditPage"),
        breadcrumb: "Produk Baru",
      },
      {
        path: "products/:id/edit",
        component: () => import("@pages/dashboard/business/ProductEditPage"),
        breadcrumb: "Edit Produk",
      },
      {
        path: "products/:id/stock",
        component: () => import("@pages/dashboard/business/StockAdjustPage"),
        breadcrumb: "Kelola Stok",
      },
      {
        path: "sales",
        component: () => import("@pages/dashboard/business/SalesPage"),
        breadcrumb: "Penjualan",
      },
      {
        path: "business-report",
        component: () => import("@pages/dashboard/business/BusinessReportPage"),
        breadcrumb: "Laporan & Laba/Rugi",
      },
      {
        path: "transfers",
        component: () => import("@pages/dashboard/business/TransfersPage"),
        breadcrumb: "Transfer Antar-Pembukuan",
      },
      {
        path: "audit",
        component: () => import("@pages/dashboard/business/AuditPage"),
        breadcrumb: "Audit",
      },
      {
        path: "business-settings",
        component: () => import("@pages/dashboard/business/BusinessSettingsPage"),
        breadcrumb: "Pengaturan Bisnis",
      },
      {
        path: "admin",
        layout: AdminGuard,
        component: Outlet,
        breadcrumb: "Admin",
        children: [
          {
            path: "",
            index: true,
            component: () => import("@/pages/admin/AdminOverviewPage"),
            breadcrumb: "Overview",
          },
          {
            path: "users",
            component: () => import("@/pages/admin/AdminUsersPage"),
            breadcrumb: "User Management",
          },
          {
            path: "audit",
            component: () => import("@/pages/admin/AdminAuditPage"),
            breadcrumb: "Audit Log",
          },
          {
            path: "plans",
            component: () => import("@/pages/admin/AdminPlansPage"),
            breadcrumb: "Plan Catalog",
          },
        ],
      },
      // Catch-all: path /dashboard/* yang tidak match → render 404 in-content
      // supaya AppShell (sidebar + navbar) tetap tampil. Tanpa ini, RouteKit
      // melempar ke /404 yang full-screen dan user kehilangan konteks.
      {
        path: "*",
        component: () => import("@pages/dashboard/DashboardNotFoundPage"),
        breadcrumb: "Tidak Ditemukan",
      },
    ],
  },
];

export default dashboardRoutes;
