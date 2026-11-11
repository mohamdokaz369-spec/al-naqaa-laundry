const storageKey = "alnaqaa:last-tracked-order";

type TrackedOrder = { orderNumber: string; phone: string };

export function readTrackedOrder(): TrackedOrder | null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (typeof value?.orderNumber === "string" && typeof value?.phone === "string") {
      return value;
    }
  } catch {
    // Tracking still works if browser storage is unavailable.
  }
  return null;
}

export function rememberTrackedOrder(order: TrackedOrder) {
  try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch {}
}

export function forgetTrackedOrder() {
  try { localStorage.removeItem(storageKey); } catch {}
}
