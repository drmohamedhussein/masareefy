"use client";

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
import { useI18n } from "@/components/providers/locale-provider";
import { faqJsonLd, organizationJsonLd, webApplicationJsonLd } from "@/lib/seo/metadata";

export function HomePageClient() {
  const { t } = useI18n();
  const m = t.marketing;

  const FAQ = [
    { question: m.faq.q1, answer: m.faq.a1 },
    { question: m.faq.q2, answer: m.faq.a2 },
    { question: m.faq.q3, answer: m.faq.a3 },
    { question: m.faq.q4, answer: m.faq.a4 },
  ];

  const features = [
    { icon: Receipt, title: m.features.table, text: m.features.tableDesc },
    { icon: Tags, title: m.features.tags, text: m.features.tagsDesc },
    { icon: Bell, title: m.features.subs, text: m.features.subsDesc },
    { icon: Sheet, title: m.features.sheets, text: m.features.sheetsDesc },
    { icon: StickyNote, title: m.features.notion, text: m.features.notionDesc },
    { icon: Smartphone, title: m.features.mobile, text: m.features.mobileDesc },
  ];

  return (
    <>
      <JsonLd data={[webApplicationJsonLd(), organizationJsonLd(), faqJsonLd(FAQ)]} />

      <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--accent-soft)] to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-sm text-[var(--muted-foreground)]">
              <Lock className="h-4 w-4 text-[var(--accent)]" />
              {m.heroBadge}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{m.heroTitle}</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted-foreground)]">{m.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/expenses" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-medium text-white shadow-lg hover:opacity-90">
                <Wallet className="h-5 w-5" />
                {m.heroCta}
              </Link>
              <Link href="/features" className="inline-flex rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-base font-medium hover:bg-[var(--hover)]">
                {m.heroSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-2xl font-semibold">{m.whyTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold">{m.faqTitle}</h2>
          <dl className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <CalendarDays className="mx-auto h-10 w-10 text-[var(--accent)]" />
        <h2 className="mt-4 text-2xl font-semibold">{m.readyTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--muted-foreground)]">{m.readySubtitle}</p>
        <Link href="/expenses" className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 font-medium text-white hover:opacity-90">
          {m.readyCta}
        </Link>
      </section>
    </>
  );
}
