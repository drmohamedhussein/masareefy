"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/locale-provider";

export function AboutPageClient() {
  const { t } = useI18n();
  const m = t.marketing.aboutPage;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">{m.title}</h1>
      <p className="mt-6 text-lg leading-8 text-[var(--muted-foreground)]">{m.lead}</p>
      <p className="mt-6 text-sm leading-7 text-[var(--muted-foreground)]">{m.body}</p>
      <Link href="/contact" className="mt-8 inline-flex text-[var(--accent)] hover:underline">
        {t.nav.contact} →
      </Link>
    </div>
  );
}
