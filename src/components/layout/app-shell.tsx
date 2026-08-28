"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";

const NAV = [
  { href: "/expenses", label: "المصروفات", icon: Receipt },
  { href: "/subscriptions", label: "الاشتراكات", icon: RefreshCw },
  { href: "/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/analytics", label: "الإحصاءات", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useClientMounted();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-l md:border-[var(--border)] md:bg-[var(--sidebar)]">
      <div className="flex items-center gap-2 px-5 py-5">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
          <Wallet className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            مصاريفي
          </p>
          <p className="text-xs text-[var(--muted)]">تتبع مصاريفك بسهولة</p>
        </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6" aria-label="القائمة الرئيسية">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
        {mounted && isAdmin && (
          <Link
            href="/admin"
            aria-current={
              pathname === "/admin" || pathname.startsWith("/admin/")
                ? "page"
                : undefined
            }
            className={cn(
              "mt-2 flex items-center gap-2 rounded-md border border-dashed border-[var(--border)] px-3 py-2 text-sm transition-colors",
              pathname === "/admin"
                ? "bg-amber-50 font-medium text-amber-800"
                : "text-[var(--muted-foreground)] hover:bg-[var(--hover)]",
            )}
          >
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            لوحة الأدمن
          </Link>
        )}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur md:hidden"
      aria-label="تنقل الجوال"
    >
      <ul className="grid grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2.5 text-[11px]",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({
  children,
  embed = false,
}: {
  children: React.ReactNode;
  embed?: boolean;
}) {
  if (embed) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
