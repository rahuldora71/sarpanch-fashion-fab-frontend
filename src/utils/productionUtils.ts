import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { GarmentStatus } from "@/types/cutting";
import type {
  DominantOrderPhase,
  OrderProductionProgressSummary,
  ScheduledGarmentSummary,
} from "@/types/productionCalendar";

// ============================================================
// DATE FORMATTING
// ============================================================

export function formatDueDate(dateStr?: string | null): string {
  if (!dateStr) return "No date set";
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function isDueDateOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    return isPast(d) && !isToday(d);
  } catch {
    return false;
  }
}

// ============================================================
// STATUS DISPLAY (Dark & Light Theme Compatible)
// ============================================================

export const garmentStatusLabel: Record<GarmentStatus, string> = {
  FABRIC_CUT: "Pending Cutting",
  CUTTING: "In Cutting",
  WASHING: "Washing",
  STITCHING: "In Stitching",
  IRONING: "Ironing",
  READY: "Ready",
  DELIVERED: "Delivered",
  ALTERATION: "Alteration",
  CANCELLED: "Cancelled",
};

export const garmentStatusColor: Record<GarmentStatus, string> = {
  FABRIC_CUT:
    "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30",
  CUTTING:
    "bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/30",
  WASHING:
    "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  STITCHING:
    "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/30",
  IRONING:
    "bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/30",
  READY:
    "bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/30",
  DELIVERED:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ALTERATION:
    "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30",
  CANCELLED:
    "bg-muted text-muted-foreground border-border",
};

// ============================================================
// CAPACITY STATUS COLORS (Dark & Light Theme Compatible)
// ============================================================

export const capacityStatusColor = {
  GREEN: {
    bg: "bg-emerald-500/8 dark:bg-emerald-500/10 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/20",
    border: "border-emerald-500/25 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  YELLOW: {
    bg: "bg-amber-500/10 dark:bg-amber-500/12 hover:bg-amber-500/18 dark:hover:bg-amber-500/22",
    border: "border-amber-500/30 dark:border-amber-500/35",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  RED: {
    bg: "bg-rose-500/10 dark:bg-rose-500/12 hover:bg-rose-500/18 dark:hover:bg-rose-500/22",
    border: "border-rose-500/30 dark:border-rose-500/35",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
    badge:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
  LOCKED: {
    bg: "bg-muted/60 dark:bg-muted/30",
    border: "border-border",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
  HOLIDAY: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15 hover:bg-purple-500/18",
    border: "border-purple-500/30 dark:border-purple-500/35",
    dot: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-300",
    badge:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
} as const;

export type CapacityStatus = keyof typeof capacityStatusColor;

// ============================================================
// DOMINANT ORDER PHASE STYLING (Dark & Light Theme Compatible)
// ============================================================

export const dominantPhaseStyle: Record<
  DominantOrderPhase,
  {
    title: string;
    shortTitle: string;
    badgeClass: string;
    barClass: string;
    cardBorderClass: string;
    iconBgClass: string;
  }
> = {
  CUTTING: {
    title: "Cutting Phase",
    shortTitle: "Cutting",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    barClass: "bg-gradient-to-r from-amber-500 to-blue-500",
    cardBorderClass: "border-l-4 border-l-amber-500",
    iconBgClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  STITCHING: {
    title: "Stitching Phase",
    shortTitle: "Stitching",
    badgeClass:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    barClass: "bg-gradient-to-r from-violet-500 to-indigo-500",
    cardBorderClass: "border-l-4 border-l-violet-500",
    iconBgClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  IRONING: {
    title: "Ironing & Finishing Phase",
    shortTitle: "Ironing",
    badgeClass:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    barClass: "bg-gradient-to-r from-orange-500 to-amber-500",
    cardBorderClass: "border-l-4 border-l-orange-500",
    iconBgClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  READY_FOR_DELIVERY: {
    title: "Ready for Delivery",
    shortTitle: "Ready",
    badgeClass:
      "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    barClass: "bg-gradient-to-r from-teal-500 to-cyan-500",
    cardBorderClass: "border-l-4 border-l-teal-500",
    iconBgClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
  PARTIALLY_DELIVERED: {
    title: "Partially Delivered (Ready)",
    shortTitle: "Partial Delivery",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    barClass: "bg-gradient-to-r from-sky-500 to-teal-500",
    cardBorderClass: "border-l-4 border-l-sky-500",
    iconBgClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  DELIVERED: {
    title: "Complete Order Delivered",
    shortTitle: "Delivered",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    barClass: "bg-gradient-to-r from-emerald-500 to-green-500",
    cardBorderClass: "border-l-4 border-l-emerald-500",
    iconBgClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
};

/**
 * Client-side helper to compute OrderProductionProgressSummary from a list of garments,
 * enforcing:
 * 1. Strict All-Garments Delivery Rule: never mark order DELIVERED unless 100% of garments are DELIVERED.
 * 2. Dominant Phase Comparison Rule: if Cutting garments > Ironing garments, show Cutting progress;
 *    if Ironing garments > Cutting garments, show Ironing progress.
 */
export function computeOrderProgressFromGarments(
  orderId: number,
  garments: ScheduledGarmentSummary[],
): OrderProductionProgressSummary {
  const active = garments.filter((g) => g.status !== "CANCELLED");
  const list = active.length > 0 ? active : garments;
  const total = list.length;

  let cuttingCount = 0;
  let stitchingCount = 0;
  let ironingCount = 0;
  let readyCount = 0;
  let deliveredCount = 0;
  let weightedSum = 0;

  for (const g of list) {
    switch (g.status) {
      case "FABRIC_CUT":
        cuttingCount++;
        weightedSum += 15;
        break;
      case "CUTTING":
        cuttingCount++;
        weightedSum += 30;
        break;
      case "STITCHING":
        stitchingCount++;
        weightedSum += 55;
        break;
      case "ALTERATION":
        stitchingCount++;
        weightedSum += 60;
        break;
      case "WASHING":
        ironingCount++;
        weightedSum += 72;
        break;
      case "IRONING":
        ironingCount++;
        weightedSum += 82;
        break;
      case "READY":
        readyCount++;
        weightedSum += 92;
        break;
      case "DELIVERED":
        deliveredCount++;
        weightedSum += 100;
        break;
      default:
        cuttingCount++;
        weightedSum += 15;
        break;
    }
  }

  const isFullyDelivered = total > 0 && deliveredCount === total;
  const isPartiallyDelivered = deliveredCount > 0 && deliveredCount < total;
  const isAllReadyOrDelivered =
    total > 0 && readyCount + deliveredCount === total && deliveredCount < total;

  let overallOrderProgress = total > 0 ? Math.round(weightedSum / total) : 0;
  if (!isFullyDelivered && overallOrderProgress >= 100) {
    overallOrderProgress = 96;
  }

  let dominantPhase: DominantOrderPhase;
  let dominantPhaseLabel: string;
  let dominantPhaseGarmentCount: number;
  let dominantPhaseProgress: number;

  if (isFullyDelivered) {
    dominantPhase = "DELIVERED";
    dominantPhaseLabel = `Order Delivered (${deliveredCount}/${total} Delivered)`;
    dominantPhaseGarmentCount = deliveredCount;
    dominantPhaseProgress = 100;
  } else if (isAllReadyOrDelivered) {
    if (deliveredCount > 0) {
      dominantPhase = "PARTIALLY_DELIVERED";
      dominantPhaseLabel = `Ready for Delivery (${deliveredCount}/${total} Delivered, ${readyCount} Left)`;
      dominantPhaseGarmentCount = readyCount;
      dominantPhaseProgress = Math.round(((readyCount + deliveredCount) * 100) / total);
    } else {
      dominantPhase = "READY_FOR_DELIVERY";
      dominantPhaseLabel = `Ready for Delivery (${readyCount}/${total} Ready)`;
      dominantPhaseGarmentCount = readyCount;
      dominantPhaseProgress = 92;
    }
  } else if (
    cuttingCount >= stitchingCount &&
    cuttingCount >= ironingCount &&
    cuttingCount > 0
  ) {
    dominantPhase = "CUTTING";
    dominantPhaseGarmentCount = cuttingCount;
    dominantPhaseProgress = Math.round((cuttingCount * 100) / total);
    dominantPhaseLabel = `Cutting Phase (${cuttingCount}/${total} in Cutting)`;
  } else if (
    ironingCount > cuttingCount &&
    ironingCount >= stitchingCount &&
    ironingCount > 0
  ) {
    dominantPhase = "IRONING";
    dominantPhaseGarmentCount = ironingCount;
    dominantPhaseProgress = Math.round((ironingCount * 100) / total);
    dominantPhaseLabel = `Ironing Phase (${ironingCount}/${total} in Ironing)`;
  } else {
    dominantPhase = "STITCHING";
    dominantPhaseGarmentCount = stitchingCount;
    dominantPhaseProgress = Math.round((stitchingCount * 100) / total);
    dominantPhaseLabel = `Stitching Phase (${stitchingCount}/${total} in Stitching)`;
  }

  const first = list[0];
  return {
    orderId,
    customerName: first?.customerName ?? "Customer",
    customerPhone: first?.customerPhone ?? "",
    sampleBookPageNumber: first?.sampleBookPageNumber ?? null,
    orderDate: null,
    totalGarments: total,
    cuttingCount,
    stitchingCount,
    ironingCount,
    readyCount,
    deliveredCount,
    dominantPhase,
    dominantPhaseLabel,
    dominantPhaseGarmentCount,
    dominantPhaseProgress,
    overallOrderProgress,
    isFullyDelivered,
    isPartiallyDelivered,
    isAllReadyOrDelivered,
    orderGarments: list,
  };
}
