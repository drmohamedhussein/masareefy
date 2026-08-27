"use client";

import { ExpensesProvider } from "@/components/expenses/expenses-provider";
import { AppShell } from "@/components/layout/app-shell";

export function AppProviders({
  children,
  embed = false,
}: {
  children: React.ReactNode;
  embed?: boolean;
}) {
  return (
    <ExpensesProvider>
      <AppShell embed={embed}>{children}</AppShell>
    </ExpensesProvider>
  );
}
