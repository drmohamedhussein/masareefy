"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/components/providers/locale-provider";

export function ContactPageClient() {
  const { t } = useI18n();
  const m = t.marketing.contactPage;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold">{m.title}</h1>
      <p className="mt-4 text-[var(--muted-foreground)]">{m.subtitle}</p>

      <div className="mt-10 flex items-start gap-4 rounded-xl border border-[var(--border)] bg-white p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <MessageCircle className="h-6 w-6" />
        </span>
        <div>
          <p className="font-medium">{m.messageTitle}</p>
          <p className="text-sm leading-7 text-[var(--muted-foreground)]">{m.messageDesc}</p>
        </div>
      </div>

      <div className="mt-10 rounded-xl bg-[var(--accent-soft)] p-6 text-center">
        <p className="font-medium text-[var(--accent)]">{m.ready}</p>
        <Link
          href="/expenses"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {t.nav.startFree}
        </Link>
      </div>
    </div>
  );
}
