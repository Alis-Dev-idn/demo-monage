import type { RouteConfig } from "@dep/route/types";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { Outlet } from "react-router-dom";

const AuthRoute: RouteConfig[] = [
  {
    path: "/auth",
    layout: GuestGuard,
    component: Outlet,
    breadcrumb: "Auth",
    children: [
      {
        path: "",
        index: true,
        component: () => import("@pages/auth/LoginPage"),
        breadcrumb: "Masuk",
      },
      {
        path: "register",
        component: () => import("@pages/auth/RegisterPage"),
        breadcrumb: "Daftar",
      },
      {
        path: "forgot-password",
        component: () => import("@pages/auth/ForgotPasswordPage"),
        breadcrumb: "Lupa Kata Sandi",
      },
      {
        path: "reset-password",
        component: () => import("@pages/auth/ResetPasswordPage"),
        breadcrumb: "Reset Kata Sandi",
      },
    ],
  },
];

export default AuthRoute;
