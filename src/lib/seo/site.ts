export const SITE = {
  name: "مصاريفي",
  nameEn: "Masareefy",
  tagline: "تطبيق عربي مجاني 100% لتتبع المصروفات الشخصية",
  description:
    "مصاريفي تطبيق عربي مجاني بالكامل لتتبع المصاريف اليومية. بياناتك تُخزَّن على جهازك فقط — بدون اشتراكات. يدعم الوسوم، الاشتراكات، Google Sheets، Notion، والتقويم.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://masareefy.app",
  locale: "ar_EG",
  language: "ar",
  email: "egywebdev@gmail.com",
  keywords: [
    "تطبيق مصاريف",
    "تتبع المصروفات",
    "ميزانية شخصية",
    "مصاريفي",
    "Masareefy",
    "تطبيق عربي مجاني",
    "مصروفات يومية",
    "اشتراكات وتجديدات",
    "Google Sheets مصروفات",
    "Notion مصروفات",
    "PWA عربي",
  ],
} as const;

export function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
