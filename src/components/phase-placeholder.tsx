import Link from "next/link";

export function PhasePlaceholder({
  title,
  description,
  nextPhase,
}: {
  title: string;
  description: string;
  nextPhase: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <p className="mb-2 text-xs font-medium text-[var(--accent)]">مرحلة الإعداد مكتملة</p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mb-6 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
        القادم: <span className="font-medium text-[var(--foreground)]">{nextPhase}</span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/expenses"
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-white hover:opacity-90"
        >
          المصروفات
        </Link>
        <Link
          href="/embed"
          className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-[var(--hover)]"
        >
          نسخة Notion Embed
        </Link>
      </div>
    </section>
  );
}
