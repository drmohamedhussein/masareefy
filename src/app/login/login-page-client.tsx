"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useI18n } from "@/components/providers/locale-provider";

export default function LoginPageClient() {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Wallet className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t.login.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{t.login.subtitle}</p>
        </div>
      </div>

      <Link
        href="/expenses"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        {t.login.enterApp}
      </Link>

      <p className="mt-6 text-center text-xs leading-6 text-[var(--muted-foreground)]">
        {t.login.noEmail}{" "}
        <Link href="/privacy" className="text-[var(--accent)] hover:underline">
          {t.login.privacyLink}
        </Link>
      </p>
    </div>
  );
}
