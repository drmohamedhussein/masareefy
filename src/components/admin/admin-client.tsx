"use client";

import { useState } from "react";
import { Shield, LogOut, KeyRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { useExpenses } from "@/components/expenses/expenses-provider";
import { formatMoney } from "@/core/money";
import type { CurrencyCode } from "@/core/types";
import { hashPin } from "@/lib/auth/session";
import { getExpenseRepository } from "@/lib/storage/get-repository";

export function AdminClient() {
  const { isAdmin, loginAdmin, logoutAdmin } = useAuth();
  const { t } = useI18n();
  const { expenses, subscriptions, profile, refresh } = useExpenses();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const repo = getExpenseRepository();
  const currency = (profile?.currency ?? "EGP") as CurrencyCode;

  const totalSpent = expenses.reduce(
    (sum, e) => sum + (e.amount ?? 0),
    0,
  );

  const handleLogin = async () => {
    setError(null);
    const ok = await loginAdmin(pin);
    if (!ok) {
      setError(t.admin.wrongPin);
      return;
    }
    setPin("");
  };

  const handleChangePin = async () => {
    if (!newPin || newPin.length < 4) {
      setError("استخدم 4 أحرف على الأقل");
      return;
    }
    await repo.updateProfile({
      adminPinHash: await hashPin(newPin),
      role: "admin",
    });
    await refresh();
    setNewPin("");
    setError(null);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <header className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Shield className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold">{t.admin.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.nav.admin}
          </p>
        </header>

        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <label className="block text-sm">
            <span className="mb-2 block text-[var(--muted)]">{t.admin.pinLabel}</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={t.admin.pinFirstTime}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLogin();
              }}
            />
          </label>
          {error && (
            <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
          )}
          <button
            type="button"
            onClick={() => void handleLogin()}
            className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white"
          >
            {t.admin.login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.admin.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.admin.welcome} {profile?.displayName ?? t.admin.title} — {t.admin.fullAccess}
          </p>
        </div>
        <button
          type="button"
          onClick={logoutAdmin}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--hover)]"
        >
          <LogOut className="h-4 w-4" />
          {t.admin.logout}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs text-[var(--muted)]">{t.admin.totalExpenses}</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(totalSpent, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs text-[var(--muted)]">{t.admin.recordCount}</p>
          <p className="text-xl font-semibold">{expenses.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs text-[var(--muted)]">{t.admin.activeSubs}</p>
          <p className="text-xl font-semibold">
            {subscriptions.filter((s) => s.active).length}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <KeyRound className="h-4 w-4" />
          {t.admin.changePin}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder={t.admin.newPinPlaceholder}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleChangePin()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {t.common.save}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">{t.admin.capabilities}</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{t.admin.capStats}</li>
          <li>{t.admin.capPin}</li>
        </ul>
      </section>
    </div>
  );
}
