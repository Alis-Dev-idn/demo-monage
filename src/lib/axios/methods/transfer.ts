import type { AxiosInstance } from "axios";
import type {
  DownloadOptions,
  DownloadProgress,
  UploadOptions,
  UploadProgress,
} from "../types";

/** @internal Progress event snapshot for speed calculation */
interface ProgressSnapshot {
  loaded: number;
  timestamp: number;
}

/**
 * Calculates transfer speed using a rolling window of the last two progress events.
 *
 * @param prev - The previous progress snapshot
 * @param current - The current progress snapshot
 * @returns Speed in bytes per second
 */
function calculateSpeed(prev: ProgressSnapshot, current: ProgressSnapshot): number {
  const timeDelta = (current.timestamp - prev.timestamp) / 1000; // seconds
  const bytesDelta = current.loaded - prev.loaded;
  if (timeDelta <= 0) return 0;
  return bytesDelta / timeDelta;
}

/**
 * Calculates estimated time remaining for a transfer.
 *
 * @param total - Total bytes to transfer (0 if unknown)
 * @param loaded - Bytes transferred so far
 * @param speed - Current speed in bytes per second
 * @returns Estimated seconds remaining, or Infinity if unknown
 */
function calculateEstimatedTime(total: number, loaded: number, speed: number): number {
  if (speed <= 0 || total <= 0) return Infinity;
  return (total - loaded) / speed;
}

/**
 * Mixin that adds download and upload methods with detailed progress tracking
 * to an AxiosKit instance.
 */
export class TransferMethods {
  /** @internal The underlying Axios instance */
  protected readonly instance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.instance = instance;
  }

  /**
   * Downloads a file and reports detailed progress.
   *
   * @param url - Download URL (relative to baseURL)
   * @param options - Download configuration including progress callback and filename
   * @returns A Blob containing the downloaded file
   *
   * @example
   * ```typescript
   * const blob = await api.download("/reports/export", {
   *   filename: "report.pdf",
   *   onProgress: (p) => console.log(`${p.percent}% — ${p.speed} B/s`),
   * });
   * ```
   */
  async download(url: string, options?: DownloadOptions): Promise<Blob> {
    let prevSnapshot: ProgressSnapshot | null = { loaded: 0, timestamp: Date.now() };
    let currentSpeed = 0;

    const response = await this.instance.get<Blob>(url, {
      responseType: "blob",
      signal: options?.signal,
      headers: options?.headers,
      onDownloadProgress: (event) => {
        if (!options?.onProgress) return;

        const loaded = event.loaded;
        const total = event.total ?? 0;
        const now = Date.now();

        const currentSnapshot: ProgressSnapshot = { loaded, timestamp: now };

        if (prevSnapshot) {
          currentSpeed = calculateSpeed(prevSnapshot, currentSnapshot);
        }

        prevSnapshot = currentSnapshot;

        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        const estimatedTime = calculateEstimatedTime(total, loaded, currentSpeed);

        const progress: DownloadProgress = {
          percent,
          loaded,
          total,
          speed: currentSpeed,
          estimatedTime,
        };

        options.onProgress(progress);
      },
    });

    const blob = response.data;

    // Auto-trigger browser download if filename is provided
    if (options?.filename && typeof window !== "undefined" && typeof document !== "undefined") {
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = options.filename;
      anchor.click();
      queueMicrotask(() => URL.revokeObjectURL(objectUrl));
    }

    return blob;
  }

  /**
   * Uploads a file or FormData and reports detailed progress.
   *
   * If a plain `File` is provided, it is automatically wrapped in `FormData`
   * with the key `"file"`.
   *
   * @typeParam T - The expected response body type
   * @param url - Upload URL (relative to baseURL)
   * @param data - File or FormData to upload
   * @param options - Upload configuration including progress callback
   * @returns The response body typed as `T`
   *
   * @example
   * ```typescript
   * const result = await api.upload<{ url: string }>("/user/avatar", file, {
   *   onProgress: (p) => console.log(`${p.percent}%`),
   * });
   * ```
   */
  async upload<T>(url: string, data: File | FormData, options?: UploadOptions): Promise<T> {
    // Wrap plain File in FormData
    let payload: FormData;
    if (data instanceof File) {
      payload = new FormData();
      payload.append("file", data);
    } else {
      payload = data;
    }

    let prevSnapshot: ProgressSnapshot | null = { loaded: 0, timestamp: Date.now() };
    let currentSpeed = 0;

    const response = await this.instance.post<T>(url, payload, {
      signal: options?.signal,
      // Forward query params (mis. `bookId`) — tanpa ini upload gambar produk /
      // logo bisnis resolve ke pembukuan default & ditolak "bukan pembukuan
      // bisnis".
      params: options?.params,
      headers: {
        "Content-Type": "multipart/form-data",
        ...options?.headers,
      },
      onUploadProgress: (event) => {
        if (!options?.onProgress) return;

        const loaded = event.loaded;
        const total = event.total ?? 0;
        const now = Date.now();

        const currentSnapshot: ProgressSnapshot = { loaded, timestamp: now };

        if (prevSnapshot) {
          currentSpeed = calculateSpeed(prevSnapshot, currentSnapshot);
        }

        prevSnapshot = currentSnapshot;

        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        const estimatedTime = calculateEstimatedTime(total, loaded, currentSpeed);

        const progress: UploadProgress = {
          percent,
          loaded,
          total,
          speed: currentSpeed,
          estimatedTime,
        };

        options.onProgress(progress);
      },
    });

    return response.data;
  }
}
