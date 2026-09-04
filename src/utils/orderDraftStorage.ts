import type { OrderDraft } from "@/types/order";

const STORAGE_KEY = "sff-create-order-draft";

export function loadOrderDraft(): OrderDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as OrderDraft;

    if (!parsed || !Array.isArray(parsed.garments)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load order draft:", error);
    return null;
  }
}

export function saveOrderDraft(draft: OrderDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save order draft:", error);
  }
}

export function clearOrderDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear order draft:", error);
  }
}
