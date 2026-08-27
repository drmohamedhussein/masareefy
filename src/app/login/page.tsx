import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <h1 className="mb-2 text-2xl font-semibold">مرحبًا في مصروفي</h1>
        <p className="mb-6 text-sm leading-7 text-[var(--muted-foreground)]">
          تسجيل الدخول عبر Supabase Auth سيُفعَّل في المرحلة التالية بعد إعداد المشروع. يمكنك
          الآن استعراض هيكل الواجهة والتنقّل.
        </p>
        <Link
          href="/expenses"
          className="inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          الدخول إلى التطبيق
        </Link>
      </div>
    </div>
  );
}
