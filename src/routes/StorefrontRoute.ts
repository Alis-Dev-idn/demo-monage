import type { RouteConfig } from "@dep/route";

// Halaman beli-mandiri publik (#C2) — diakses pelanggan via link/QR tanpa login.
export const StorefrontRoute: RouteConfig[] = [
  {
    path: "/store/:bookId",
    component: () => import("@pages/StorefrontPage"),
    breadcrumb: "Toko",
  },
];
