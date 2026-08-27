import { DEFAULT_TAGS } from "./types";

/** ألوان الوسوم — جاهزة لربط Notion multi_select */
export const TAG_COLORS: Record<string, string> = {
  طعام: "#ef4444",
  مواصلات: "#3b82f6",
  منزل: "#a855f7",
  فواتير: "#f59e0b",
  صحة: "#10b981",
  تعليم: "#06b6d4",
  ترفيه: "#ec4899",
  تسوق: "#8b5cf6",
  اشتراكات: "#6366f1",
  أخرى: "#64748b",
};

const FALLBACK_PALETTE = [
  "#0ea5e9",
  "#14b8a6",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#e11d48",
];

export function colorForTag(tag: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]!;
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]!;
}

export function isKnownDefaultTag(tag: string): boolean {
  return (DEFAULT_TAGS as readonly string[]).includes(tag);
}
