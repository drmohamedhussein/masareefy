import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Users } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata, organizationJsonLd } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "من نحن",
  description:
    "تعرّف على فريق مصاريفي ورؤيتنا: تطبيق عربي مجاني لتتبع المصروفات مع احترام خصوصية المستخدم وتخزين البيانات محلياً على الجهاز.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold">من نحن</h1>
        <p className="mt-6 text-lg leading-8 text-[var(--muted-foreground)]">
          <strong className="text-[var(--foreground)]">{SITE.name}</strong>{" "}
          مشروع عربي مفتوح المصدر الهدف منه تبسيط تتبع المصاريف الشخصية
          للمستخدم العربي. نؤمن أن أدوات المال الشخصي يجب أن تكون{" "}
          <strong>مجانية</strong>، <strong>خاصة</strong>، و{" "}
          <strong>سهلة الاستخدام</strong>.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "مجاني للجميع",
              text: "لا اشتراكات ولا رسوم خفية — 100% مجاني.",
            },
            {
              icon: Shield,
              title: "خصوصيتك أولاً",
              text: "بياناتك على جهازك. لا نخزّن مصاريفك على سيرفراتنا.",
            },
            {
              icon: Users,
              title: "للمستخدم العربي",
              text: "واجهة RTL عربية كاملة مع دعم العملات المحلية.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--border)] bg-white p-5 text-center"
            >
              <Icon className="mx-auto h-8 w-8 text-[var(--accent)]" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm leading-7 text-[var(--muted-foreground)]">
          مصاريفي متاح كتطبيق ويب (PWA)، تطبيق أندرويد عبر Capacitor، وإضافة
          ووردبريس للمواقع متعددة المستخدمين. الربط مع Google و Notion اختياري
          ويستخدم حسابك الشخصي فقط.
        </p>

        <Link
          href="/contact"
          className="mt-8 inline-flex text-[var(--accent)] hover:underline"
        >
          تواصل معنا ←
        </Link>
      </div>
    </>
  );
}
