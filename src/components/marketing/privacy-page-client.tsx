"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/locale-provider";

export function PrivacyPageClient() {
  const { t } = useI18n();
  const m = t.marketing.privacyPage;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">{m.title}</h1>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">{m.updated}</p>
      <div className="mt-8 space-y-6 text-sm leading-8 text-[var(--muted-foreground)]">
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s1title}</h2>
          <p className="mt-2">{m.s1}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s2title}</h2>
          <ul className="mt-2 list-disc space-y-2 pe-6">
            {m.s2items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s3title}</h2>
          <p className="mt-2">{m.s3}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s4title}</h2>
          <p className="mt-2">{m.s4}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s5title}</h2>
          <p className="mt-2">{m.s5}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{m.s6title}</h2>
          <p className="mt-2">
            {m.s6}{" "}
            <Link href="/contact" className="text-[var(--accent)] hover:underline">
              {t.nav.contact}
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
