"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "Masareefy.install.dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (isIos && isSafari) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-3 top-3 z-50 mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-white p-4 shadow-lg sm:inset-x-auto sm:start-auto sm:end-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">ثبّت مصاريفي على جهازك</p>
          <p className="mt-1 text-xs leading-6 text-[var(--muted-foreground)]">
            {iosHint
              ? "من Safari: شارك ← إضافة إلى الشاشة الرئيسية"
              : "يفتح كتطبيق مستقل من سطح المكتب أو الهاتف بدون متجر"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!iosHint && deferred && (
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
              >
                تثبيت الآن
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]"
            >
              لاحقًا
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="إغلاق"
          className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)]"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
