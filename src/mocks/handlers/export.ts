import { http, HttpResponse } from "msw";
import type {
  ExportBundle,
  ExportJob,
  ExportScope,
  RequestExportPayload,
} from "@/types";
import { endpoint } from "../baseUrl";
import { __getCurrentDemoUser } from "./auth";
import { storageAdapter } from "../storage/adapter";
import type { Account, Book, Budget, Category, Transaction } from "@/types";

const ALL_SCOPES: ExportScope[] = [
  "profile",
  "books",
  "accounts",
  "categories",
  "transactions",
  "budgets",
  "savings",
  "savingMovements",
];

const jobs: ExportJob[] = [];
const createdBlobUrls: string[] = [];

function nextJobId(): string {
  return `job-${Date.now()}`;
}

async function buildBundle(scope: ExportScope[]): Promise<ExportBundle> {
  const [accounts, categories, transactions, books, budgets] = await Promise.all([
    storageAdapter.getAll<Account>("accounts"),
    storageAdapter.getAll<Category>("categories"),
    storageAdapter.getAll<Transaction>("transactions"),
    storageAdapter.getAll<Book>("books"),
    storageAdapter.getAll<Budget>("budgets"),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    format: "json",
    schemaVersion: 1,
    user: scope.includes("profile") ? __getCurrentDemoUser() : null,
    books: scope.includes("books") ? books : [],
    accounts: scope.includes("accounts") ? accounts : [],
    categories: scope.includes("categories") ? categories : [],
    transactions: scope.includes("transactions") ? transactions : [],
    budgets: scope.includes("budgets") ? budgets : [],
    savings: [],
    savingMovements: [],
  };
}

/**
 * Sanitasi string untuk mitigasi CSV Formula / Spreadsheet Injection.
 * Karakter pemicu formula: =, +, -, @, \t, \r, |, %
 */
function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  const formulaTriggers = ["=", "+", "-", "@", "\t", "\r", "|", "%"];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Buat blob URL untuk download di FE dengan lifecycle cleanup untuk mencegah memory leak.
 */
function makeDownloadUrl(content: string | ArrayBuffer, mime: string): string {
  while (createdBlobUrls.length >= 10) {
    const oldUrl = createdBlobUrls.shift();
    if (oldUrl && typeof window !== "undefined") {
      URL.revokeObjectURL(oldUrl);
    }
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  createdBlobUrls.push(url);
  return url;
}

export const exportHandlers = [
  http.post(endpoint("/export"), async ({ request }) => {
    const body = (await request.json()) as RequestExportPayload;
    const scope = body.scope && body.scope.length > 0 ? body.scope : ALL_SCOPES;
    const id = nextJobId();
    const now = new Date().toISOString();

    const job: ExportJob = {
      id,
      format: body.format,
      scope,
      from: body.from ?? null,
      to: body.to ?? null,
      bookId: body.bookId ?? null,
      status: "processing",
      requestedAt: now,
      completedAt: null,
      downloadUrl: null,
      fileSizeBytes: null,
      errorMessage: null,
    };
    jobs.push(job);

    // Simulasi async job 500ms
    setTimeout(() => {
      void (async () => {
        try {
          const bundle = await buildBundle(scope);
          let downloadUrl = "";
          let bytes = 0;
          if (body.format === "json") {
            const content = JSON.stringify(bundle, null, 2);
            downloadUrl = makeDownloadUrl(content, "application/json");
            bytes = content.length;
          } else if (body.format === "csv") {
            const headers = "id,type,amount,occurredAt,note\n";
            const rows = (bundle.transactions as Array<Record<string, unknown>>)
              .map((t) => {
                const idStr = sanitizeCsvField(t._id || t.id);
                const typeStr = sanitizeCsvField(t.type);
                const amountStr = sanitizeCsvField(t.amount);
                const occurredAtStr = sanitizeCsvField(t.occurredAt);
                const noteStr = sanitizeCsvField(t.note ?? "");
                return `${idStr},${typeStr},${amountStr},${occurredAtStr},${noteStr}`;
              })
              .join("\n");
            const content = headers + rows;
            downloadUrl = makeDownloadUrl(content, "text/csv;charset=utf-8;");
            bytes = content.length;
          } else {
            // xlsx mock
            const content = JSON.stringify(bundle);
            downloadUrl = makeDownloadUrl(
              content,
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            bytes = content.length;
          }
          job.status = "completed";
          job.completedAt = new Date().toISOString();
          job.downloadUrl = downloadUrl;
          job.fileSizeBytes = bytes;
        } catch (err) {
          job.status = "failed";
          job.errorMessage = err instanceof Error ? err.message : "Unknown error";
        }
      })();
    }, 500);

    return HttpResponse.json(job, { status: 202 });
  }),

  http.get(endpoint("/export/jobs"), () => {
    return HttpResponse.json(
      [...jobs].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    );
  }),

  http.get(endpoint("/export/jobs/:id"), ({ params }) => {
    const job = jobs.find((j) => j.id === params.id);
    if (!job) return HttpResponse.json({ message: "Job tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(job);
  }),
];
