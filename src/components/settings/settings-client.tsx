"use client";

import { useEffect, useState } from "react";
import { Download, FileUp, Sheet } from "lucide-react";
import { getStorageModeLabel } from "@/lib/storage/get-repository";
import { ExportPanel } from "@/components/settings/export-panel";
import { GoogleSheetsPanel } from "@/components/settings/google-sheets-panel";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "export" | "google";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: "general", label: "عام", icon: <Download className="h-4 w-4" /> },
  { id: "export", label: "تصدير", icon: <FileUp className="h-4 w-4" /> },
  { id: "google", label: "Google Sheets", icon: <Sheet className="h-4 w-4" /> },
];

export function SettingsClient() {
  const [tab, setTab] = useState<SettingsTab>("export");
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const storageMode = getStorageModeLabel();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">الإعدادات</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          تثبيت التطبيق، تصدير المصروفات، وربط Google Sheets
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              tab === item.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--hover)]",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <h2 className="mb-3 font-medium">تثبيت مصروفي كتطبيق</h2>
            {installed ? (
              <p className="text-sm text-[var(--success)]">
                التطبيق مثبت ويعمل بوضع مستقل على هذا الجهاز.
              </p>
            ) : (
              <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <p>
                  ثبّته من المتصفح ليظهر كأيقونة مستقلة على ويندوز أو الهاتف.
                </p>
                {canInstall && deferred && (
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
                    onClick={async () => {
                      await deferred.prompt();
                      await deferred.userChoice;
                      setCanInstall(false);
                    }}
                  >
                    تثبيت الآن
                  </button>
                )}
              </div>
            )}
          </section>

          <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm shadow-[var(--shadow-sm)]">
            <p className="mb-1 font-medium">العملة</p>
            <p className="text-[var(--muted-foreground)]">جنيه مصري (ج.م)</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm shadow-[var(--shadow-sm)]">
            <p className="mb-1 font-medium">أين تُحفظ بياناتك؟</p>
            <p className="text-[var(--muted-foreground)]">{storageMode}</p>
          </div>
        </div>
      )}

      {tab === "export" && <ExportPanel />}
      {tab === "google" && <GoogleSheetsPanel />}
    </div>
  );
}
