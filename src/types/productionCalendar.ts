// ============================================================
// PRODUCTION CALENDAR TYPES
// Mirror the backend ProductionCalendarDtos DTOs.
// ============================================================

import type { CapacityStatus } from "@/utils/productionUtils";

export type DominantOrderPhase =
  | "CUTTING"
  | "STITCHING"
  | "IRONING"
  | "READY_FOR_DELIVERY"
  | "PARTIALLY_DELIVERED"
  | "DELIVERED";

export interface DaySummary {
  date: string;
  dayOfWeek: number;
  scheduledGarments: number;
  completedGarments: number;
  pendingGarments: number;
  cuttingPending: number;
  stitchingPending: number;

  maxCapacity: number;
  effectiveCapacity: number;
  remainingCapacity: number;

  capacityStatus: CapacityStatus;
  capacityPercentageUsed: number;

  isBlocked: boolean;
  blockReason?: string | null;

  isHoliday: boolean;
  holidayName?: string | null;
  deliveryAllowed: boolean;

  workersPresent: number;
  workersAbsent: number;
  isPowerCut: boolean;
  capacityNote?: string | null;

  // Order-level progress metrics
  scheduledOrders?: number;
  ordersInCutting?: number;
  ordersInStitching?: number;
  ordersInIroning?: number;
  ordersReadyForDelivery?: number;
  ordersFullyDelivered?: number;
  averageOrderProgress?: number;
}

export interface ProductionCalendarResponse {
  monthStart: string;
  monthEnd: string;
  days: DaySummary[];
  defaultDailyCapacity: number;
}

export interface ScheduledGarmentSummary {
  garmentId: number;
  orderId: number;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  sampleBookPageNumber?: string | null;
  status: string;
  tryDate?: string | null;
  dueDate: string;
  customerFabric: boolean;
  madeByWorkerId?: number | null;
  madeByWorkerName?: string | null;
  cuttingByWorkerName?: string | null;
}

export interface OrderProductionProgressSummary {
  orderId: number;
  customerName: string;
  customerPhone: string;
  sampleBookPageNumber?: string | null;
  orderDate?: string | null;
  totalGarments: number;
  cuttingCount: number;
  stitchingCount: number;
  ironingCount: number;
  readyCount: number;
  deliveredCount: number;
  dominantPhase: DominantOrderPhase;
  dominantPhaseLabel: string;
  dominantPhaseGarmentCount: number;
  dominantPhaseProgress: number;
  overallOrderProgress: number;
  isFullyDelivered: boolean;
  isPartiallyDelivered: boolean;
  isAllReadyOrDelivered: boolean;
  orderGarments: ScheduledGarmentSummary[];
}

export interface WorkerAttendanceSummary {
  workerId: number;
  workerName: string;
  role: string;
  status: AttendanceStatus;
  capacityPercentage: number;
  note?: string | null;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export interface CapacityReductionSummary {
  capacityId: number;
  stage: string;
  maxCapacity: number;
  reducedCapacity: number;
  reason?: string | null;
}

export interface DayDetailResponse {
  date: string;
  summary: DaySummary;
  garments: ScheduledGarmentSummary[];
  orders?: OrderProductionProgressSummary[];
  workerAttendance: WorkerAttendanceSummary[];
  reductions: CapacityReductionSummary[];
}

// ============================================================
// REQUEST DTOS
// ============================================================

export interface BlockDateRequest {
  date: string;
  reason?: string;
  deliveryAllowed: boolean;
  workersWorking: boolean;
  capacityPercentage: number;
}

export interface HolidayRequest {
  date: string;
  name: string;
  description?: string;
  deliveryAllowed: boolean;
  workersWorking: boolean;
  capacityPercentage: number;
  recurring: boolean;
}

export interface WorkerAttendanceRequest {
  workerId: number;
  date: string;
  status: AttendanceStatus;
  capacityPercentage: number;
  note?: string;
}

export interface CapacityConfigRequest {
  date: string;
  stage: string;
  workerId?: number;
  maxCapacity: number;
  capacityReduced: boolean;
  reductionReason?: string;
}

// ============================================================
// ENTITY TYPES (for listings)
// ============================================================

export interface BlockedDateEntity {
  id: number;
  blockedDate: string;
  reason?: string;
  deliveryAllowed: boolean;
  workersWorking: boolean;
  capacityPercentage: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayEntity {
  id: number;
  holidayDate: string;
  name: string;
  description?: string;
  deliveryAllowed: boolean;
  workersWorking: boolean;
  capacityPercentage: number;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}