"use client";

import { ExpensesProvider } from "@/components/expenses/expenses-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ReminderScheduler } from "@/components/notifications/reminder-scheduler";
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
      <AuthProvider>
        <ReminderScheduler />
        <AppShell embed={embed}>{children}</AppShell>
      </AuthProvider>
    </ExpensesProvider>
  );
}
