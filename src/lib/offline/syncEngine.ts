import { ApiError } from "@dep/axios";
import { notify } from "@dep/notify";
import { api } from "@/utils/api";
import { eventBus } from "@/utils/eventBus";
import { allOps, removeOp, updateOp } from "./outbox";
import type { OutboxOp } from "./db";

/**
 * Sync Engine (Batch O3). Mendorong (push) antrean Outbox ke server secara
 * **serial** (satu siklus pada satu waktu) dengan header `Idempotency-Key` =
 * `op.id`, memanfaatkan idempotency backend (O2) agar retry tidak menggandakan.
 *
 * Pemicu: online kembali, tab aktif, pesan native `net:status`, dan saat init.
 */

let running = false;
let queuedAgain = false;

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** Error yang boleh di-retry nanti (jangan buang dari outbox). */
function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) {
    // status 0 = network/timeout; 409 = idempotency in-progress; 5xx = server.
    return err.status === 0 || err.status === 409 || err.status >= 500;
  }
  return true; // error tak dikenal → aman-kan dengan retry
}

async function pushOne(op: OutboxOp): Promise<"done" | "retry" | "failed"> {
  const headers = { "Idempotency-Key": op.id };
  try {
    if (op.method === "POST") {
      await api().post(op.url, op.body, { headers });
    } else if (op.method === "PATCH") {
      await api().patch(op.url, op.body, { headers });
    } else {
      await api().delete(op.url, { headers });
    }
    return "done";
  } catch (err) {
    if (isRetryable(err)) {
      op.attempts += 1;
      op.lastError = err instanceof ApiError ? err.message : String(err);
      await updateOp(op);
      return "retry";
    }
    return "failed";
  }
}

/**
 * Jalankan satu siklus sync. Mutex: bila sedang berjalan, tandai agar dijalankan
 * sekali lagi setelah selesai (menangkap perubahan yang masuk saat push).
 */
export async function triggerSync(): Promise<void> {
  if (!isOnline()) return;
  if (running) {
    queuedAgain = true;
    return;
  }
  running = true;
  try {
    let changed = false;
    const ops = await allOps();
    for (const op of ops) {
      const res = await pushOne(op);
      if (res === "done") {
        await removeOp(op.seq!);
        changed = true;
      } else if (res === "failed") {
        await removeOp(op.seq!);
        changed = true;
        notify.error(
          `Gagal sinkron ${labelFor(op)}: ${op.lastError ?? "ditolak server"}.`,
        );
      } else {
        // retry → hentikan siklus; coba lagi pada pemicu berikutnya.
        break;
      }
    }
    if (changed) {
      eventBus.emit("outbox:changed");
      eventBus.emit("transaction:changed");
      eventBus.emit("account:changed");
      eventBus.emit("budget:changed");
      eventBus.emit("saving:changed");
    }
  } finally {
    running = false;
    if (queuedAgain) {
      queuedAgain = false;
      void triggerSync();
    }
  }
}

function labelFor(op: OutboxOp): string {
  const e = op.entity === "transaction" ? "transaksi" : "tabungan";
  const a =
    op.action === "create" ? "buat" : op.action === "update" ? "ubah" : "hapus";
  return `${a} ${e}`;
}

let initialized = false;

/** Pasang listener pemicu sync. Idempoten — aman dipanggil sekali di App. */
export function initSyncEngine(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const kick = () => void triggerSync();
  window.addEventListener("online", kick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") kick();
  });
  // Pesan native (monage-mobile): {type:"net:status",online} / {type:"app:resumed"}
  window.addEventListener("message", (e: MessageEvent) => {
    try {
      const raw = typeof e.data === "string" ? e.data : "";
      if (!raw) return;
      const m = JSON.parse(raw);
      if ((m?.type === "net:status" && m.online) || m?.type === "app:resumed") {
        kick();
      }
    } catch {
      /* abaikan */
    }
  });
  // hook global agar shell native bisa memicu langsung
  (window as unknown as { __monageSync?: () => void }).__monageSync = kick;

  // Coba flush saat start (bila ada sisa antrean & online).
  kick();
}
