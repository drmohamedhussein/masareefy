let pendingSync = 0;
let dirty = false;

export function markSyncPending(): void {
  pendingSync += 1;
  dirty = true;
}

export function markSyncComplete(): void {
  pendingSync = Math.max(0, pendingSync - 1);
  if (pendingSync === 0) dirty = false;
}

export function hasPendingSync(): boolean {
  return dirty || pendingSync > 0;
}

export function setDirty(value: boolean): void {
  dirty = value;
}
