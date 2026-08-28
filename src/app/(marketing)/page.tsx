import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Lock,
  Receipt,
  Sheet,
  Smartphone,
  StickyNote,
  Tags,
  Wallet,
} from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  faqJsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "تطبيق عربي مجاني لتتبع المصروفات",
  description: SITE.description,
  path: "/",
});

const FAQ = [
  {
    question: "هل مصاريفي مجاني؟",
    answer:
      "نعم، مصاريفي مجاني 100% بدون اشتراكات أو رسوم خفية. كل الميزات متاحة للجميع.",
  },
  {
    question: "أين تُخزَّن بياناتي؟",
    answer:
      "تُخزَّن المصروفات محلياً على جهازك (المتصفح أو التطبيق). لا نرفع بياناتك إلى سيرفراتنا. الربط مع Google أو Notion اختياري ويستخدم حسابك الشخصي فقط.",
  },
  {
    question: "هل يدعم العربية واتجاه RTL؟",
    answer:
      "نعم، الواجهة عربية بالكامل مع دعم RTL وتنسيق مناسب للجنيه المصري والعملات الأخرى.",
  },
  {
    question: "هل يمكن تثبيته كتطبيق على الجوال؟",
    answer:
      "نعم، مصاريفي PWA يمكن تثبيته على Android و iOS و Windows من المتصفح.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[webApplicationJsonLd(), organizationJsonLd(), faqJsonLd(FAQ)]}
      />

      <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--accent-soft)] to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-sm text-[var(--muted-foreground)]">
              <Lock className="h-4 w-4 text-[var(--accent)]" />
              مجاني 100% · بياناتك على جهازك فقط
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              تتبّع مصاريفك بسهولة مع{" "}
              <span className="text-[var(--accent)]">{SITE.name}</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted-foreground)]">
              تطبيق عربي لتسجيل المشتريات اليومية، تصنيفها بوسوم، متابعة
              الاشتراكات، ومزامنة اختيارية مع Google Sheets و Notion — بدون
              تكلفة وبدون تخزين سحابي إجباري.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/expenses"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-medium text-white shadow-lg hover:opacity-90"
              >
                <Wallet className="h-5 w-5" />
                ابدأ الآن مجاناً
              </Link>
              <Link
                href="/features"
                className="inline-flex rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-base font-medium hover:bg-[var(--hover)]"
              >
                استكشف المميزات
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          لماذا مصاريفي؟
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Receipt,
              title: "جدول مصروفات سريع",
              text: "سجّل السعر والاسم والتصنيف والملاحظات في واجهة شبيهة بـ Notion.",
            },
            {
              icon: Tags,
              title: "وسوم وتصنيفات",
              text: "صنّف مشترياتك: طعام، مواصلات، اشتراكات، فواتير، وأكثر.",
            },
            {
              icon: Bell,
              title: "تذكيرات الاشتراكات",
              text: "تابع تجديد Netflix وغيره مع إشعارات و Google Calendar.",
            },
            {
              icon: Sheet,
              title: "Google Sheets",
              text: "مزامنة اختيارية مع جدول في حساب Google الشخصي.",
            },
            {
              icon: StickyNote,
              title: "Notion",
              text: "تصدير واستيراد ومزامنة فورية مع قاعدة Notion الخاصة بك.",
            },
            {
              icon: Smartphone,
              title: "PWA للجوال",
              text: "ثبّت التطبيق على شاشتك الرئيسية ويعمل دون اتصال جزئي.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            أسئلة شائعة
          </h2>
          <dl className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <CalendarDays className="mx-auto h-10 w-10 text-[var(--accent)]" />
        <h2 className="mt-4 text-2xl font-semibold">جاهز للبدء؟</h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--muted-foreground)]">
          لا تسجيل إجباري. افتح التطبيق وابدأ تسجيل مصاريفك في ثوانٍ.
        </p>
        <Link
          href="/expenses"
          className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 font-medium text-white hover:opacity-90"
        >
          افتح مصاريفي
        </Link>
      </section>
    </>
  );
}
