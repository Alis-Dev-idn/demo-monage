import { http, HttpResponse } from "msw";
import { endpoint } from "../baseUrl";
import { resetDemoData, type DemoPersonaId } from "../storage/reset";
import { storageAdapter } from "../storage/adapter";

export const demoHandlers = [
  http.post(endpoint("/demo/reset"), async ({ request }) => {
    let targetPersona: DemoPersonaId = "personal";
    try {
      const body = (await request.json()) as { targetPersona?: DemoPersonaId };
      if (body?.targetPersona) {
        targetPersona = body.targetPersona;
      }
    } catch {
      // Body empty or not JSON -> default to "personal"
    }

    const result = await resetDemoData(targetPersona);

    return HttpResponse.json({
      success: true,
      message: result.message,
      activePersona: result.activePersona,
      user: result.user,
      activeBookId: result.activeBookId,
      resetAt: new Date().toISOString(),
    });
  }),

  http.get(endpoint("/demo/status"), async () => {
    let activePersona = "personal";
    if (typeof window !== "undefined") {
      activePersona =
        window.sessionStorage.getItem("monage:mock:activePersona") ||
        window.localStorage.getItem("monage:activePersona") ||
        "personal";
    }

    const isSeeded = await storageAdapter.isSeeded();

    return HttpResponse.json({
      mode: "standalone-demo",
      engine: "MSW v2 + IndexedDB",
      activePersona,
      dbName: "monage-demo-db",
      seededVersion: "2026-10-23-v1",
      isSeeded,
      isOfflineReady: true,
    });
  }),
];
