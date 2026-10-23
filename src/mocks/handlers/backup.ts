import { http, HttpResponse } from "msw";
import type {
  BackupConfig,
  BackupConnection,
  BackupJob,
  CloudProvider,
  OAuthStartResponse,
} from "@/types";
import { endpoint } from "../baseUrl";

const PROVIDER_LABEL: Record<CloudProvider, string> = {
  google_drive: "Google Drive",
  dropbox: "Dropbox",
  onedrive: "OneDrive",
};

const DEFAULT_FOLDER: Record<CloudProvider, string> = {
  google_drive: "Apps/Monage/Backups",
  dropbox: "Apps/Monage/Backups",
  onedrive: "Apps/Monage/Backups",
};

/** State mock — dipertahankan di module scope (bukan localStorage) selama tab. */
const connections: BackupConnection[] = [
  {
    provider: "google_drive",
    accountEmail: null,
    folderPath: null,
    connectedAt: null,
    needsReauth: false,
  },
  {
    provider: "dropbox",
    accountEmail: null,
    folderPath: null,
    connectedAt: null,
    needsReauth: false,
  },
  {
    provider: "onedrive",
    accountEmail: null,
    folderPath: null,
    connectedAt: null,
    needsReauth: false,
  },
];

const WINDOW_LABEL = "00:00–05:00";
const SLOT_COUNT = 300; // 00:00–05:00, per menit

function slotToLabel(slot: number | null): string | null {
  if (slot === null) return null;
  const h = Math.floor(slot / 60);
  const m = slot % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

let config: BackupConfig = {
  defaultProvider: null,
  connections,
  autoBackup: "off",
  scheduleSlot: null,
  scheduledTimeLabel: null,
  windowLabel: WINDOW_LABEL,
  retentionCount: 7,
  notifyEmail: true,
};

const jobs: BackupJob[] = [];

function nextJobId(): string {
  return `bkp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function findConn(provider: CloudProvider): BackupConnection {
  return connections.find((c) => c.provider === provider) ?? connections[0];
}

/**
 * Helper: untuk mock OAuth, kita "auto-complete" begitu user buka authorizeUrl.
 * URL yang dikirim adalah callback FE `/backup/oauth/callback?provider=...`
 * yang frontend bisa handle untuk close window + show success. Untuk demo,
 * kita pakai trik: ketika user kunjungi `/auth/mock-oauth?provider=`,
 * server (mock) langsung set connection sebagai connected.
 */
export const backupHandlers = [
  http.get(endpoint("/backup/config"), () => {
    return HttpResponse.json({ ...config, connections });
  }),

  http.patch(endpoint("/backup/config"), async ({ request }) => {
    const body = (await request.json()) as Partial<BackupConfig>;
    config = { ...config, ...body, connections };
    // Assign a stable random slot saat auto-backup dinyalakan (mirror server).
    if (config.autoBackup === "daily" && config.scheduleSlot === null) {
      config.scheduleSlot = Math.floor(Math.random() * SLOT_COUNT);
    }
    config.scheduledTimeLabel = slotToLabel(config.scheduleSlot);
    config.windowLabel = WINDOW_LABEL;
    return HttpResponse.json(config);
  }),

  http.post(endpoint("/backup/oauth/start"), async ({ request }) => {
    const body = (await request.json()) as { provider: CloudProvider };
    const state = `mock-state-${Date.now()}`;
    // URL mock: arahkan ke endpoint mock-callback yang langsung tandai
    // connection terhubung. Di production, ini akan jadi URL Google sungguhan.
    const authorizeUrl = `${window.location.origin}/api/backup/oauth/mock-callback?provider=${body.provider}&state=${state}`;
    return HttpResponse.json({
      provider: body.provider,
      authorizeUrl,
      state,
    } satisfies OAuthStartResponse);
  }),

  // Mock callback — saat user buka URL ini, kita "complete" OAuth dan
  // emit `postMessage` ke window.opener (matching production flow di
  // `BackupController.oauthCallback` + renderCallbackHtml).
  http.get(endpoint("/backup/oauth/mock-callback"), ({ request }) => {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") as CloudProvider | null;
    if (!provider) {
      return new HttpResponse("Provider missing", { status: 400 });
    }
    const conn = findConn(provider);
    conn.accountEmail = `demo.${provider}@example.com`;
    conn.folderPath = DEFAULT_FOLDER[provider];
    conn.connectedAt = new Date().toISOString();
    conn.needsReauth = false;
    if (!config.defaultProvider) config.defaultProvider = provider;
    const payload = JSON.stringify({
      type: "monage:oauth-backup",
      ok: true,
      provider,
      accountEmail: conn.accountEmail,
    });
    return new HttpResponse(
      `<!doctype html><html><body>
<h2>${PROVIDER_LABEL[provider]} terhubung &#10003;</h2>
<p>Tutup tab ini dan kembali ke Monage.</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage(${payload}, window.location.origin);
    }
  } catch (e) {}
  setTimeout(function () { try { window.close(); } catch (e) {} }, 600);
</script>
</body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  }),

  http.delete(endpoint("/backup/connections/:provider"), ({ params }) => {
    const provider = params.provider as CloudProvider;
    const conn = findConn(provider);
    conn.accountEmail = null;
    conn.folderPath = null;
    conn.connectedAt = null;
    conn.needsReauth = false;
    if (config.defaultProvider === provider) config.defaultProvider = null;
    return HttpResponse.json(conn);
  }),

  http.post(endpoint("/backup/run"), async ({ request }) => {
    const body = (await request.json()) as { provider: CloudProvider };
    const conn = findConn(body.provider);
    if (!conn.connectedAt) {
      return HttpResponse.json(
        {
          statusCode: 422,
          code: "PROVIDER_NOT_CONNECTED",
          message: `${PROVIDER_LABEL[body.provider]} belum terhubung. Connect dulu.`,
        },
        { status: 422 },
      );
    }
    const id = nextJobId();
    const job: BackupJob = {
      _id: id,
      provider: body.provider,
      trigger: "manual",
      status: "uploading",
      startedAt: new Date().toISOString(),
      completedAt: null,
      cloudFileUrl: null,
      cloudPath: null,
      fileSizeBytes: null,
      errorMessage: null,
    };
    jobs.push(job);
    // Simulasi upload selesai dalam 1.5 detik.
    setTimeout(() => {
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      const fname = `monage-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      job.cloudPath = `${conn.folderPath}/${fname}`;
      job.cloudFileUrl = `https://${body.provider}.example.com/file/${id}`;
      job.fileSizeBytes = 12_345 + Math.floor(Math.random() * 100_000);
      // Prune retensi
      const myJobs = jobs.filter((j) => j.provider === body.provider && j.status === "completed");
      myJobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const keep = myJobs.slice(0, config.retentionCount);
      for (let i = jobs.length - 1; i >= 0; i--) {
        if (jobs[i].provider !== body.provider) continue;
        if (jobs[i].status !== "completed") continue;
        if (!keep.includes(jobs[i])) jobs.splice(i, 1);
      }
    }, 1500);
    return HttpResponse.json(job, { status: 202 });
  }),

  http.get(endpoint("/backup/jobs"), () => {
    return HttpResponse.json(
      [...jobs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    );
  }),

  http.get(endpoint("/backup/jobs/:id"), ({ params }) => {
    const job = jobs.find((j) => j._id === params.id);
    if (!job) return HttpResponse.json({ message: "Job tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(job);
  }),
];
