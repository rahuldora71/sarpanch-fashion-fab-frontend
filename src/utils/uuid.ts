import { v4 as uuidv4 } from "uuid";

/**
 * Robust UUID generator that works in both secure contexts (HTTPS / localhost)
 * and insecure contexts (LAN HTTP on 192.168.x.x, mobile browser test environments).
 */
export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    try {
      return window.crypto.randomUUID();
    } catch {
      // Fallback if browser restricts crypto.randomUUID
    }
  }

  // Fallback using the standard uuid package
  try {
    return uuidv4();
  } catch {
    // Ultimate fallback if uuid package fails in older runtime
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
