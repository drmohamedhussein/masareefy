"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/locale-provider";
import { SITE } from "@/lib/seo/site";

export function MarketingFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="text-lg font-semibold">{t.brand.name}</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
            {t.brand.tagline}. {t.common.localStorage}.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">{t.nav.features}</p>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li><Link href="/features" className="hover:text-[var(--accent)]">{t.nav.features}</Link></li>
            <li><Link href="/about" className="hover:text-[var(--accent)]">{t.nav.about}</Link></li>
            <li><Link href="/privacy" className="hover:text-[var(--accent)]">{t.nav.privacy}</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--accent)]">{t.nav.contact}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">{t.brand.name}</p>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li><Link href="/expenses" className="hover:text-[var(--accent)]">{t.nav.expenses}</Link></li>
            <li><Link href="/subscriptions" className="hover:text-[var(--accent)]">{t.nav.subscriptions}</Link></li>
            <li><Link href="/login" className="hover:text-[var(--accent)]">{t.nav.login}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6">
        © {year} {SITE.name} — {t.common.free}
      </div>
    </footer>
  );
}
