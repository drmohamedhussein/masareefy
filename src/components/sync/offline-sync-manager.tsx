"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/locale-provider";
import { hasPendingSync } from "@/lib/sync/sync-state";
import { syncExpensesEverywhere } from "@/lib/sync/everywhere";
import { getExpenseRepository } from "@/lib/storage/get-repository";
import { markSyncComplete } from "@/lib/sync/sync-state";

export function OfflineSyncManager() {
  const { t } = useI18n();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    void (async () => {
      if (!hasPendingSync()) return;
      try {
        const rows = await getExpenseRepository().listExpenses();
        await syncExpensesEverywhere(rows);
        markSyncComplete();
      } catch {
        /* retry on next online */
      }
    })();
  }, [online]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingSync()) return;
      event.preventDefault();
      event.returnValue = t.common.unsavedWarning;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [t.common.unsavedWarning]);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] bg-amber-600 px-4 py-2 text-center text-sm text-white"
    >
      {t.common.offline} — {t.common.offlineHint}
    </div>
  );
}
