import type { Metadata } from "next";
import Link from "next/link";
import { LogIn, Shield, Wallet } from "lucide-react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "تسجيل الدخول",
  description:
    "ادخل إلى مصاريفي مجاناً. لا حاجة لحساب للبدء — بياناتك تُخزَّن على جهازك. تسجيل اختياري للأدمن وربط Google.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <LogIn className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">مرحباً في مصاريفي</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            مجاني 100% · تخزين على جهازك
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/expenses"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          <Wallet className="h-4 w-4" />
          الدخول إلى التطبيق (بدون تسجيل)
        </Link>

        <Link
          href="/admin"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--hover)]"
        >
          <Shield className="h-4 w-4" />
          لوحة الأدمن (PIN)
        </Link>
      </div>

      <p className="mt-6 text-center text-xs leading-6 text-[var(--muted-foreground)]">
        لا نطلب بريداً إلكترونياً للاستخدام العادي.{" "}
        <Link href="/privacy" className="text-[var(--accent)] hover:underline">
          سياسة الخصوصية
        </Link>
      </p>
    </div>
  );
}
