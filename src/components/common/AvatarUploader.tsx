import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, RotateCcw, UserCircle2, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { notify } from "@dep/notify";

interface AvatarUploaderProps {
  value?: string;
  onChange: (dataUrl: string | null) => void;
  outputSize?: number;
  maxFileSizeMB?: number;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function AvatarUploader({
  value,
  onChange,
  outputSize = 256,
  maxFileSizeMB = 10,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bersihkan object URL saat unmount / ganti source.
  useEffect(() => {
    return () => {
      if (sourceUrl?.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const handleFile = (file: File) => {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      notify.error(`Ukuran file terlalu besar (maks ${maxFileSizeMB} MB).`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      setSourceUrl(url);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      notify.error("File bukan gambar valid.");
    };
    img.src = url;
  };

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = outputSize;
    canvas.height = outputSize;
    ctx.clearRect(0, 0, outputSize, outputSize);

    // Cover fit
    const baseScale = Math.max(outputSize / imgEl.width, outputSize / imgEl.height) * scale;
    const w = imgEl.width * baseScale;
    const h = imgEl.height * baseScale;
    const x = (outputSize - w) / 2 + offset.x;
    const y = (outputSize - h) / 2 + offset.y;

    // Background putih supaya PNG transparan tampil rapi
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.drawImage(imgEl, x, y, w, h);
  }, [imgEl, offset, scale, outputSize]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imgEl) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragOrigin({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragOrigin) return;
    setOffset({
      x: dragOrigin.ox + (e.clientX - dragOrigin.x),
      y: dragOrigin.oy + (e.clientY - dragOrigin.y),
    });
  };

  const handlePointerUp = () => setDragOrigin(null);

  const handleConfirm = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
    onChange(dataUrl);
    cleanup();
  };

  const cleanup = () => {
    if (sourceUrl?.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setImgEl(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100">
          {value ? (
            <img src={value} alt="Foto profil" className="h-full w-full object-cover" />
          ) : (
            <UserCircle2 size={48} className="text-neutral-400" />
          )}
        </div>
        <div className="space-y-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Camera size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            {value ? "Ganti Foto" : "Unggah Foto"}
          </Button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="block text-xs text-rose-600 hover:underline"
            >
              Hapus foto
            </button>
          )}
        </div>
      </div>

      {imgEl && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-600">
            Geser gambar untuk mengatur posisi, lalu gunakan slider untuk zoom.
          </p>

          <div className="flex justify-center">
            <div
              className="relative h-48 w-48 cursor-move overflow-hidden rounded-full border-2 border-emerald-400 shadow-sm"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                width={outputSize}
                height={outputSize}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="w-12">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
              aria-label="Reset zoom"
              className="rounded p-1 text-neutral-500 hover:text-neutral-900"
            >
              <RotateCcw size={14} />
            </button>
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<X size={14} />}
              onClick={cleanup}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              leftIcon={<Check size={14} />}
              onClick={handleConfirm}
            >
              Gunakan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
