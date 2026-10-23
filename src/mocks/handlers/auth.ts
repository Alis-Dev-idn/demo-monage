import { http, HttpResponse } from "msw";
import { endpoint } from "../baseUrl";
import { storageAdapter } from "../storage/adapter";
import { budiUser, sitiUser, freshUser } from "../seeds";
import { __setActiveTier } from "./subscription";
import type { User } from "@/types";

const PERSONA_KEY = "monage:mock:activePersona";
const USER_KEY = "monage:mock:userEmail";

export function getActivePersona(): "personal" | "business" | "fresh" {
  if (typeof window === "undefined") return "personal";
  const p =
    window.sessionStorage.getItem(PERSONA_KEY) ||
    window.localStorage.getItem("monage:activePersona");
  if (p === "business" || p === "fresh") return p;
  return "personal";
}

export function setActivePersona(p: "personal" | "business" | "fresh") {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PERSONA_KEY, p);
  window.localStorage.setItem("monage:activePersona", p);
}

export function __getCurrentDemoUser(): User {
  const persona = getActivePersona();
  if (persona === "business") return sitiUser;
  if (persona === "fresh") return freshUser;
  return budiUser;
}

function makeTokens(persona: string) {
  return {
    accessToken: `mock-access-token-${persona}-${Date.now()}`,
    refreshToken: `mock-refresh-token-${persona}-${Date.now()}`,
  };
}

function makeRefreshCookie(token: string): string {
  const isDev = typeof window !== "undefined" && !window.location.protocol.startsWith("https");
  const flags = isDev
    ? "Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"
    : "Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000";
  return `refreshToken=${token}; ${flags}`;
}

function clearRefreshCookie(): string {
  return "refreshToken=; Path=/; HttpOnly; Max-Age=0";
}

export async function resolveUserByPersona(
  persona: "personal" | "business" | "fresh",
): Promise<User> {
  const users = await storageAdapter.getAll<User>("users");
  if (persona === "business") {
    return users.find((u) => u.email === sitiUser.email) || sitiUser;
  }
  if (persona === "fresh") {
    return users.find((u) => u.email === freshUser.email) || freshUser;
  }
  return users.find((u) => u.email === budiUser.email) || budiUser;
}

export const authHandlers = [
  // ── Login Biasa (Email / Password) ─────────────────────────────────────────
  http.post(endpoint("/auth/login"), async ({ request }) => {
    const body = (await request.json()) as { email: string; password?: string };
    const email = body.email?.toLowerCase().trim();

    let persona: "personal" | "business" | "fresh" = "personal";
    if (email === "business@monage.demo" || email.includes("business") || email.includes("warung")) {
      persona = "business";
    } else if (email === "fresh@monage.demo" || email.includes("fresh")) {
      persona = "fresh";
    } else if (email === "personal@monage.demo" || email.includes("personal") || email.includes("budi")) {
      persona = "personal";
    }

    setActivePersona(persona);
    if (persona === "business") {
      __setActiveTier("business");
    } else {
      __setActiveTier("personal");
    }

    const user = await resolveUserByPersona(persona);
    const tokens = makeTokens(persona);

    return HttpResponse.json(
      { accessToken: tokens.accessToken, user },
      { headers: { "Set-Cookie": makeRefreshCookie(tokens.refreshToken) } },
    );
  }),

  // ── One-Click Persona Login ────────────────────────────────────────────────
  http.post(endpoint("/auth/persona-login"), async ({ request }) => {
    const body = (await request.json()) as { persona: "personal" | "business" | "fresh" };
    const persona = body.persona;

    if (persona !== "personal" && persona !== "business" && persona !== "fresh") {
      return HttpResponse.json(
        {
          statusCode: 400,
          code: "INVALID_PERSONA",
          message: "Persona yang dipilih tidak valid. Pilihan: personal, business, fresh.",
        },
        { status: 400 },
      );
    }

    setActivePersona(persona);

    let activeBookId = "book-personal";
    if (persona === "business") {
      activeBookId = "book-business-warung";
      __setActiveTier("business");
    } else if (persona === "fresh") {
      activeBookId = "";
      __setActiveTier("free");
    } else {
      __setActiveTier("personal");
    }

    if (typeof window !== "undefined") {
      if (activeBookId) {
        window.localStorage.setItem("monage:activeBookId", activeBookId);
      } else {
        window.localStorage.removeItem("monage:activeBookId");
      }
    }

    const user = await resolveUserByPersona(persona);
    const tokens = makeTokens(persona);

    return HttpResponse.json(
      {
        accessToken: tokens.accessToken,
        activeBookId,
        user,
      },
      { headers: { "Set-Cookie": makeRefreshCookie(tokens.refreshToken) } },
    );
  }),

  // ── Kasir Login (Username + PIN) ───────────────────────────────────────────
  http.post(endpoint("/auth/cashier-login"), async () => {
    const user = await resolveUserByPersona("business");
    const tokens = makeTokens("cashier");
    return HttpResponse.json(
      { accessToken: tokens.accessToken, user },
      { headers: { "Set-Cookie": makeRefreshCookie(tokens.refreshToken) } },
    );
  }),

  // ── Register ───────────────────────────────────────────────────────────────
  http.post(endpoint("/auth/register"), async ({ request }) => {
    const body = (await request.json()) as { email: string; name: string };
    const user: User = {
      _id: `u-reg-${Date.now()}`,
      email: body.email,
      name: body.name,
      preferences: {
        currency: "IDR",
        dateFormat: "DD/MM/YYYY",
        theme: "light",
        budgetNotification: { enabled: true, warnThreshold: 75, overThreshold: 100 },
      },
      onboardedAt: null,
      createdAt: new Date().toISOString(),
    };
    await storageAdapter.insert("users", user);
    setActivePersona("fresh");
    const tokens = makeTokens("fresh");
    return HttpResponse.json(
      { accessToken: tokens.accessToken, user },
      { status: 201, headers: { "Set-Cookie": makeRefreshCookie(tokens.refreshToken) } },
    );
  }),

  // ── Auth Me ────────────────────────────────────────────────────────────────
  http.get(endpoint("/auth/me"), async () => {
    const persona = getActivePersona();
    const user = await resolveUserByPersona(persona);
    return HttpResponse.json(user);
  }),

  http.patch(endpoint("/auth/me"), async ({ request }) => {
    const persona = getActivePersona();
    const user = await resolveUserByPersona(persona);
    const patch = (await request.json()) as Partial<User>;
    const updated = await storageAdapter.update<User>("users", user._id, patch);
    return HttpResponse.json(updated);
  }),

  http.patch(endpoint("/auth/me/preferences"), async ({ request }) => {
    const persona = getActivePersona();
    const user = await resolveUserByPersona(persona);
    const patch = (await request.json()) as Partial<User["preferences"]>;
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...patch,
      },
    };
    await storageAdapter.update<User>("users", user._id, updatedUser);
    return HttpResponse.json(updatedUser.preferences);
  }),

  // ── Logout ─────────────────────────────────────────────────────────────────
  http.post(endpoint("/auth/logout"), () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("monage:auth:accessToken");
      window.sessionStorage.removeItem(PERSONA_KEY);
      window.sessionStorage.removeItem(USER_KEY);
    }
    return HttpResponse.json(
      { ok: true },
      { headers: { "Set-Cookie": clearRefreshCookie() } },
    );
  }),

  // ── Refresh ────────────────────────────────────────────────────────────────
  http.post(endpoint("/auth/refresh"), () => {
    const persona = getActivePersona();
    const tokens = makeTokens(persona);
    return HttpResponse.json(
      { accessToken: tokens.accessToken },
      { headers: { "Set-Cookie": makeRefreshCookie(tokens.refreshToken) } },
    );
  }),

  http.post(endpoint("/auth/forgot-password"), () => HttpResponse.json({ ok: true })),
  http.post(endpoint("/auth/reset-password"), () => HttpResponse.json({ ok: true })),
  http.post(endpoint("/auth/verify-email"), () => HttpResponse.json({ ok: true })),
  http.post(endpoint("/auth/resend-verification"), () => HttpResponse.json({ ok: true })),
  http.delete(endpoint("/auth/me"), () => HttpResponse.json({ ok: true })),
  http.post(endpoint("/auth/me/change-password"), () => HttpResponse.json({ ok: true })),
];
