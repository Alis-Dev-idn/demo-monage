import { TONES, TONE_HEX, TONE_LABEL } from "@/constants/tones";
import type { Tone } from "@/types";

interface TonePickerProps {
  value: Tone;
  onChange: (tone: Tone) => void;
  className?: string;
}

export function TonePicker({ value, onChange, className = "" }: TonePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Pilih warna"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {TONES.map((tone) => {
        const isActive = tone === value;
        const palette = TONE_HEX[tone];
        return (
          <button
            key={tone}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={TONE_LABEL[tone]}
            onClick={() => onChange(tone)}
            className={`relative h-9 w-9 rounded-full ring-offset-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isActive
                ? "ring-2 ring-neutral-900 ring-offset-2"
                : "hover:scale-110"
            }`}
            style={{ background: palette.bg, color: palette.fg }}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center text-sm font-bold"
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
