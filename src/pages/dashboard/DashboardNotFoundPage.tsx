import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";

/**
 * 404 versi in-content untuk path di bawah `/dashboard/*` yang tidak match
 * route apa pun. Sidebar + navbar tetap muncul karena komponen di-render
 * sebagai child `AppShell`, bukan layout penuh layar.
 */
const DashboardNotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <AlertTriangle size={28} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-1 max-w-md text-sm text-neutral-500">
          Path{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
            {location.pathname}
          </code>{" "}
          tidak ada. Mungkin tautan kedaluwarsa atau salah ketik.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          leftIcon={<ArrowLeft size={14} />}
          onClick={() => navigate(-1)}
        >
          Kembali
        </Button>
        <Link to="/dashboard/beranda">
          <Button leftIcon={<Home size={14} />}>Ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
};

export default DashboardNotFoundPage;
