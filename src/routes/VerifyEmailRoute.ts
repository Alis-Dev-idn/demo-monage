import type { RouteConfig } from "@dep/route";

/**
 * Rute verifikasi email — publik (tanpa GuestGuard) supaya tautan dari email
 * tetap bisa dibuka meski user sedang login.
 */
const verifyEmailRoutes: RouteConfig[] = [
  {
    path: "/auth/verify-email",
    component: () => import("@pages/auth/VerifyEmailPage"),
    breadcrumb: "Verifikasi Email",
  },
];

export default verifyEmailRoutes;
