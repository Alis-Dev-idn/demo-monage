/**
 * Klien WebSocket realtime (web, v1.5). Menyambung ke `/api/ws`, subscribe ke
 * pembukuan user, dan meneruskan event ke handler (apply → eventBus + React
 * Query invalidate). Reconnect dengan backoff.
 */

export interface RealtimeEvent {
  v: number;
  bookId: string;
  entity: string;
  action: "created" | "updated" | "deleted";
  id: string;
  data?: unknown;
  actorId: string;
  ts: string;
  seq: number;
}

type EventHandler = (ev: RealtimeEvent) => void;

const MAX_BACKOFF_MS = 30_000;

class RealtimeWsClient {
  private ws: WebSocket | null = null;
  private wsUrl = "";
  private getToken: () => string | null = () => null;
  private onEvent: EventHandler = () => {};
  private desired = new Set<string>();
  private attempts = 0;
  private reconnectTimer: number | null = null;
  private stopped = true;

  configure(opts: {
    wsUrl: string;
    getToken: () => string | null;
    onEvent: EventHandler;
  }): void {
    this.wsUrl = opts.wsUrl;
    this.getToken = opts.getToken;
    this.onEvent = opts.onEvent;
  }

  start(): void {
    if (!this.stopped && this.ws) return;
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  setBooks(bookIds: string[]): void {
    const next = new Set(bookIds);
    for (const id of next) {
      if (!this.desired.has(id)) this.send({ type: "subscribe", bookId: id });
    }
    for (const id of this.desired) {
      if (!next.has(id)) this.send({ type: "unsubscribe", bookId: id });
    }
    this.desired = next;
  }

  private connect(): void {
    const token = this.getToken();
    if (!token || !this.wsUrl) {
      this.scheduleReconnect();
      return;
    }
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${this.wsUrl}?token=${encodeURIComponent(token)}`);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      for (const id of this.desired) this.send({ type: "subscribe", bookId: id });
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(String(e.data)) as {
          type?: string;
          event?: RealtimeEvent;
        };
        if (msg.type === "event" && msg.event) this.onEvent(msg.event);
      } catch {
        /* abaikan */
      }
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (!this.stopped) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return;
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.attempts);
    this.attempts++;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) this.connect();
    }, delay);
  }

  private send(obj: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(obj));
      } catch {
        /* ignore */
      }
    }
  }
}

export const realtimeWsClient = new RealtimeWsClient();

/** `https://api.monage.app/api` → `wss://api.monage.app/api/ws`; relatif → origin halaman. */
export function deriveWsUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
  if (/^https?:\/\//.test(base)) {
    return `${base.replace(/^http/, "ws").replace(/\/+$/, "")}/ws`;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}${base.replace(/\/+$/, "")}/ws`;
}
