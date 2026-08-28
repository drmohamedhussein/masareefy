import Link from "next/link";
import { SITE } from "@/lib/seo/site";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="text-lg font-semibold">{SITE.name}</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
            {SITE.tagline}. بياناتك على جهازك فقط — مجاني 100% بدون اشتراكات أو رسوم
            خفية.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">روابط</p>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li><Link href="/features" className="hover:text-[var(--accent)]">المميزات</Link></li>
            <li><Link href="/about" className="hover:text-[var(--accent)]">من نحن</Link></li>
            <li><Link href="/privacy" className="hover:text-[var(--accent)]">الخصوصية</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--accent)]">تواصل معنا</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">التطبيق</p>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li><Link href="/expenses" className="hover:text-[var(--accent)]">المصروفات</Link></li>
            <li><Link href="/subscriptions" className="hover:text-[var(--accent)]">الاشتراكات</Link></li>
            <li><Link href="/login" className="hover:text-[var(--accent)]">تسجيل الدخول</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6">
        © {year} {SITE.name} — مجاني 100% · تخزين محلي على جهازك
      </div>
    </footer>
  );
}
