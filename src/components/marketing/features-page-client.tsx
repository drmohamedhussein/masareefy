"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/locale-provider";

export function FeaturesPageClient() {
  const { t } = useI18n();
  const m = t.marketing.featuresPage;
  const f = t.marketing.features;

  const items = [
    { title: f.table, text: f.tableDesc },
    { title: f.tags, text: f.tagsDesc },
    { title: f.subs, text: f.subsDesc },
    { title: f.sheets, text: f.sheetsDesc },
    { title: f.notion, text: f.notionDesc },
    { title: f.mobile, text: f.mobileDesc },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{m.title}</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">{m.subtitle}</p>
      </header>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {items.map(({ title, text }) => (
          <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link href="/expenses" className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 font-medium text-white hover:opacity-90">
          {m.tryCta}
        </Link>
      </div>
    </div>
  );
}
