"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, Wallet, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/features", label: "المميزات" },
  { href: "/about", label: "من نحن" },
  { href: "/privacy", label: "الخصوصية" },
  { href: "/contact", label: "تواصل معنا" },
] as const;

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
            <Wallet className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="القائمة الرئيسية">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pathname === href
                  ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--hover)]",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--hover)]"
            aria-label="تسجيل الدخول"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">دخول</span>
          </Link>
          <Link
            href="/expenses"
            className="hidden rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:inline-flex"
          >
            ابدأ مجاناً
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--muted-foreground)] md:hidden"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-[var(--border)] bg-white px-4 py-3 md:hidden"
          aria-label="قائمة الجوال"
        >
          <ul className="space-y-1">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm",
                    pathname === href
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/expenses"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-lg bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-medium text-white"
              >
                ابدأ مجاناً
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
