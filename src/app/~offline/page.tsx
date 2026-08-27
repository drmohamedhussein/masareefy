import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "غير متصل",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-sm)]">
        <h1 className="mb-2 text-2xl font-semibold">أنت غير متصل حاليًا</h1>
        <p className="mb-6 text-sm leading-7 text-[var(--muted-foreground)]">
          مصاريفي يحاول العمل بدون إنترنت قدر الإمكان. بعد عودة الشبكة ستُحدَّث الصفحات
          تلقائيًا.
        </p>
        <Link
          href="/expenses"
          className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          العودة للمصروفات
        </Link>
      </div>
    </main>
  );
}
