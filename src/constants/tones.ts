import type { Tone } from "@/types";

export const TONES: Tone[] = [
  "emerald",
  "orange",
  "blue",
  "amber",
  "cyan",
  "violet",
  "rose",
  "accent",
  "neutral",
];

export const TONE_HEX: Record<Tone, { fg: string; bg: string }> = {
  emerald: { fg: "#047857", bg: "#d1fae5" },
  orange: { fg: "#c2410c", bg: "#ffedd5" },
  blue: { fg: "#1d4ed8", bg: "#dbeafe" },
  amber: { fg: "#b45309", bg: "#fef3c7" },
  cyan: { fg: "#0e7490", bg: "#cffafe" },
  violet: { fg: "#6d28d9", bg: "#ede9fe" },
  rose: { fg: "#be123c", bg: "#ffe4e6" },
  accent: { fg: "#4338ca", bg: "#e0e7ff" },
  neutral: { fg: "#374151", bg: "#f3f4f6" },
};

type LibTone = "accent" | "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";

export const TO_LIB_TONE: Record<Tone, LibTone> = {
  emerald: "emerald",
  orange: "amber",
  blue: "cyan",
  amber: "amber",
  cyan: "cyan",
  violet: "violet",
  rose: "rose",
  accent: "accent",
  neutral: "slate",
};

export const TONE_LABEL: Record<Tone, string> = {
  emerald: "Hijau",
  orange: "Oranye",
  blue: "Biru",
  amber: "Kuning",
  cyan: "Tosca",
  violet: "Ungu",
  rose: "Merah Muda",
  accent: "Indigo",
  neutral: "Abu",
};
