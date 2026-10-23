import { useEffect, useState } from "react";

/**
 * Status koneksi (Batch O1). Sumber:
 *  - `navigator.onLine` + event `online`/`offline` (browser)
 *  - pesan jembatan native `{type:"net:status",online}` dari shell mobile
 *    (WebView) — lebih andal daripada event WebView.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Jembatan native (monage-mobile): {type:"net:status", online:boolean}
    const onMessage = (e: MessageEvent) => {
      try {
        const raw = typeof e.data === "string" ? e.data : "";
        if (!raw) return;
        const msg = JSON.parse(raw);
        if (msg && msg.type === "net:status" && typeof msg.online === "boolean") {
          setOnline(msg.online);
        }
      } catch {
        /* abaikan pesan non-JSON */
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return online;
}
