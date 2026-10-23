import { storageAdapter } from "./adapter";
import { budiUser, sitiUser, freshUser } from "../seeds";

export type DemoPersonaId = "personal" | "business" | "fresh";

export interface ResetDemoResult {
  success: boolean;
  message: string;
  activePersona: DemoPersonaId;
  user: typeof budiUser | typeof sitiUser | typeof freshUser;
  activeBookId: string;
}

export async function resetDemoData(
  targetPersona: DemoPersonaId = "personal",
): Promise<ResetDemoResult> {
  // 1. Re-seed IndexedDB from scratch
  await storageAdapter.seedAll(true);

  // 2. Resolve active persona user & book
  let activeUser = budiUser;
  let activeBookId = "book-personal";

  if (targetPersona === "business") {
    activeUser = sitiUser;
    activeBookId = "book-business-warung";
  } else if (targetPersona === "fresh") {
    activeUser = freshUser;
    activeBookId = "";
  }

  // 3. Sync browser session & local storage
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("monage:mock:activePersona", targetPersona);
    window.sessionStorage.setItem("monage:auth:accessToken", `mock-token-${targetPersona}`);
    window.localStorage.setItem("monage:activePersona", targetPersona);
    window.localStorage.setItem("monage:auth:user", JSON.stringify(activeUser));

    if (activeBookId) {
      window.localStorage.setItem("monage:activeBookId", activeBookId);
    } else {
      window.localStorage.removeItem("monage:activeBookId");
    }

    // Reset banner dismissal state so banner informs demonstrator
    window.sessionStorage.removeItem("monage:demo:bannerDismissed");
  }

  return {
    success: true,
    message: "Data demo berhasil dikembalikan ke kondisi awal.",
    activePersona: targetPersona,
    user: activeUser,
    activeBookId,
  };
}
