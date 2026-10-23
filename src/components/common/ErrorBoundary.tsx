import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@dep/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback custom — kalau tidak diberikan, pakai screen default. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Tangkap crash unhandled di sub-tree React (mis. throw di render, hook
 * tidak boleh dipanggil di kondisi tertentu, dsb.) supaya user tidak
 * lihat blank putih. Untuk error async (network / fetch), gunakan
 * `try/catch` + `notify.error(getFriendlyError(e))` di handler-nya —
 * ErrorBoundary tidak menangkap promise rejection.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Cukup log untuk DevTools — production bisa kirim ke Sentry di sini.
    console.error("[ErrorBoundary] crash:", error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={28} />
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold text-neutral-900">
              Halaman ini bermasalah
            </h1>
            <p className="text-sm text-neutral-600">
              Ada error tak terduga saat memuat. Coba refresh — kalau tetap
              muncul, kontak support dengan detail di bawah.
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-neutral-100 p-3 text-left text-[11px] text-neutral-700">
              {this.state.error.message}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button
              leftIcon={<RotateCcw size={14} />}
              onClick={() => {
                this.reset();
                window.location.reload();
              }}
            >
              Refresh
            </Button>
            <Button variant="outline" onClick={this.reset}>
              Coba lagi
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
