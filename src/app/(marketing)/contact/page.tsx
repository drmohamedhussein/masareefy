import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "تواصل معنا",
  description:
    "تواصل مع فريق مصاريفي للدعم والاقتراحات والشراكات. تطبيق مجاني عربي لتتبع المصروفات.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">تواصل معنا</h1>
      <p className="mt-4 text-[var(--muted-foreground)]">
        نسعد بسماع اقتراحاتك وأسئلتك حول {SITE.name}.
      </p>

      <div className="mt-10 space-y-4">
        <a
          href={`mailto:${SITE.email}`}
          className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white p-5 hover:border-[var(--accent)]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Mail className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium">البريد الإلكتروني</p>
            <p className="text-sm text-[var(--muted-foreground)]">{SITE.email}</p>
          </div>
        </a>

        <div className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-white p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <MessageCircle className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium">اقتراحات وميزات</p>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              أخبرنا ما الميزة التي تود إضافتها. مصاريفي مفتوح المصدر ونرحب
              بالمساهمات عبر GitHub.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl bg-[var(--accent-soft)] p-6 text-center">
        <p className="font-medium text-[var(--accent)]">جاهز للتجربة؟</p>
        <Link
          href="/expenses"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          افتح التطبيق مجاناً
        </Link>
      </div>
    </div>
  );
}
