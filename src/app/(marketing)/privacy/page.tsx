import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "سياسة الخصوصية",
  description:
    "سياسة خصوصية مصاريفي: تخزين محلي على جهاز المستخدم، مجاني 100%، وربط اختياري بحسابات Google و Notion الشخصية.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
  <>
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `سياسة الخصوصية — ${SITE.name}`,
        description: "سياسة خصوصية تطبيق مصاريفي",
        url: `${SITE.url}/privacy`,
      }}
    />
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 prose prose-sm max-w-none">
      <h1 className="text-3xl font-bold not-prose">سياسة الخصوصية</h1>
      <p className="mt-4 text-[var(--muted-foreground)] not-prose">
        آخر تحديث: أغسطس 2026
      </p>

      <section className="mt-8 space-y-6 text-sm leading-8 text-[var(--muted-foreground)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            1. ملخص سريع
          </h2>
          <p>
            {SITE.name} تطبيق مجاني 100% لتتبع المصروفات الشخصية.{" "}
            <strong className="text-[var(--foreground)]">
              بياناتك المالية تُخزَّن محلياً على جهازك
            </strong>{" "}
            (localStorage في المتصفح أو تخزين التطبيق). لا نجمع ولا نبيع
            بيانات مصاريفك.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            2. ما نخزّنه
          </h2>
          <ul className="list-disc space-y-2 pe-6">
            <li>المصروفات، الوسوم، الاشتراكات، والإعدادات — على جهازك فقط.</li>
            <li>
              رمز أدمن مشفّر محلياً (إن استخدمت لوحة الأدمن) — على جهازك فقط.
            </li>
            <li>
              بيانات ربط Google أو Notion (إن فعّلتها) — تُحفظ في متصفحك
              ولا تمر عبر سيرفراتنا إلا عند مزامنة Notion عبر API آمن.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            3. الربط الاختياري
          </h2>
          <p>
            عند ربط Google Sheets أو Calendar أو Notion، أنت تفوّض حسابك
            الشخصي فقط. الجداول والأحداث تُنشأ في حسابك أنت، وليس في حساب
            مطوّر التطبيق.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            4. ملفات تعريف الارتباط
          </h2>
          <p>
            لا نستخدم ملفات تعريف ارتباط تتبعية. قد يستخدم المتصفح تخزيناً
            محلياً لتشغيل التطبيق وحفظ بياناتك.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            5. حقوقك
          </h2>
          <p>
            يمكنك حذف بياناتك في أي وقت بمسح بيانات الموقع من إعدادات
            المتصفح أو إلغاء تثبيت التطبيق. يمكنك تصدير بياناتك JSON من
            الإعدادات.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            6. التواصل
          </h2>
          <p>
            للاستفسارات:{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-[var(--accent)] hover:underline"
            >
              {SITE.email}
            </a>
          </p>
        </div>
      </section>
    </article>
  </>
  );
}
