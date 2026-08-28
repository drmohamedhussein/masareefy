export const SITE = {
  name: "Masareefy",
  nameAr: "مصاريفي",
  tagline: "Free personal expense tracker",
  taglineAr: "تطبيق مجاني لتتبع المصروفات الشخصية",
  description:
    "Masareefy is a free expense tracker. Your data stays on your device. Optional sync with your own Google or Notion account.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://masareefy.app",
  locale: "en_US",
  language: "en",
  keywords: [
    "expense tracker",
    "personal finance",
    "budget app",
    "Masareefy",
    "free expense app",
    "Arabic expense tracker",
    "مصاريفي",
    "تطبيق مصاريف",
  ],
} as const;

export function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
