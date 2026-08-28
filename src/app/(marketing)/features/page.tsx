import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Download,
  Lock,
  Receipt,
  RefreshCw,
  Sheet,
  StickyNote,
  Tags,
} from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata, webApplicationJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "المميزات",
  description:
    "اكتشف مميزات مصاريفي: تتبع المصروفات، الوسوم، الاشتراكات والتجديدات، الإحصاءات، Google Sheets، Notion، والتقويم — مجاني 100% وتخزين محلي.",
  path: "/features",
});

const FEATURES = [
  {
    icon: Receipt,
    title: "جدول مصروفات ذكي",
    points: [
      "إدخال سريع: السعر، الاسم، التصنيف، الملاحظات",
      "ترقيم تلقائي وفرز حسب السعر أو الاسم",
      "فلترة بالتاريخ والوسم والبحث",
    ],
  },
  {
    icon: Tags,
    title: "وسوم Notion-style",
    points: [
      "تصنيفات جاهزة: طعام، مواصلات، اشتراكات…",
      "وسم «اشتراكات» يربط المصروف بتبويب التجديدات",
    ],
  },
  {
    icon: RefreshCw,
    title: "الاشتراكات والتجديدات",
    points: [
      "تتبع Netflix و Spotify وغيرها",
      "تذكير قبل التجديد أو في نفس اليوم",
      "مزامنة مع Google Calendar",
    ],
  },
  {
    icon: Bell,
    title: "إشعارات المتصفح",
    points: [
      "تفعيل التذكير لكل اشتراك من جدول المصروفات",
      "أيقونة جرس بجانب كل صف",
    ],
  },
  {
    icon: CalendarDays,
    title: "تقويم المصروفات",
    points: ["عرض يومي وشهري", "إجماليات لكل يوم"],
  },
  {
    icon: BarChart3,
    title: "إحصاءات وتحليلات",
    points: ["إجمالي الشهر", "أعلى يوم صرف", "توزيع حسب الوسوم"],
  },
  {
    icon: Sheet,
    title: "Google موحّد",
    points: [
      "ربط واحد: Sheets + Drive + Calendar",
      "مزامنة تلقائية بعد كل تعديل",
    ],
  },
  {
    icon: StickyNote,
    title: "Notion",
    points: [
      "مزامنة فورية ثنائية الاتجاه",
      "تصدير واستيراد JSON كامل",
    ],
  },
  {
    icon: Download,
    title: "تصدير",
    points: ["Excel · PDF · CSV · JSON"],
  },
  {
    icon: Lock,
    title: "خصوصية وتخزين محلي",
    points: [
      "البيانات على جهازك فقط",
      "مجاني 100% بدون اشتراكات",
      "لا نبيع بياناتك",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={webApplicationJsonLd()} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">مميزات مصاريفي</h1>
          <p className="mt-4 text-[var(--muted-foreground)]">
            كل ما تحتاجه لإدارة مصاريفك الشخصية — عربي، مجاني، ومحلي على جهازك.
          </p>
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, points }) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--border)] bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
                {points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/expenses"
            className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 font-medium text-white hover:opacity-90"
          >
            جرّب التطبيق مجاناً
          </Link>
        </div>
      </div>
    </>
  );
}
