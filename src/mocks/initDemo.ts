import { storageAdapter } from "./storage/adapter";
import { worker } from "./browser";

export async function initDemoEnvironment(): Promise<void> {
  // 1. Initialize persistent IndexedDB and seed if needed
  try {
    await storageAdapter.init();
  } catch (err) {
    console.error("[Demo] Failed to initialize demo storage:", err);
  }

  // 2. Setup initial persona and book in session if empty
  if (typeof window !== "undefined") {
    const activePersona =
      window.sessionStorage.getItem("monage:mock:activePersona") ||
      window.localStorage.getItem("monage:activePersona");

    if (!activePersona) {
      window.sessionStorage.setItem("monage:mock:activePersona", "personal");
      window.localStorage.setItem("monage:activePersona", "personal");
    }

    const currentToken = window.sessionStorage.getItem("monage:auth:accessToken");
    if (!currentToken) {
      const p = activePersona || "personal";
      window.sessionStorage.setItem("monage:auth:accessToken", `mock-token-${p}`);
    }

    const activeBookId = window.localStorage.getItem("monage:activeBookId");
    if (!activeBookId && activePersona !== "fresh") {
      const defaultBook = activePersona === "business" ? "book-business-warung" : "book-personal";
      window.localStorage.setItem("monage:activeBookId", defaultBook);
    }
  }

  // 3. Start MSW worker
  try {
    await worker.start({
      onUnhandledRequest: "warn",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
    console.info("[Demo] MSW v2 engine started with IndexedDB persistence.");
  } catch (err) {
    console.warn("[Demo] MSW worker registration failed or unsupported in this context:", err);
  }
}
