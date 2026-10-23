import type { AttendanceStatus } from "./productionCalendar";
import type { GarmentStatus } from "./order";

export type WorkerSpecialty =
  | "STITCHING"
  | "CUTTING"
  | "IRONING"
  | "MASTER_TAILOR"
  | "ALTERATION"
  | "FINISHING";

export interface Worker {
  id: number;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  dailyCapacity: number;
  workerSpecialty: WorkerSpecialty | string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  active: boolean;
  todayAttendanceStatus?: AttendanceStatus;
  todayCapacityPercentage?: number;
  createdAt?: string;
}

export interface WorkerRequest {
  name: string;
  phone: string;
  alternatePhone?: string;
  dailyCapacity: number;
  workerSpecialty: string;
  imageUrl?: string;
  imagePublicId?: string;
  address?: string;
  city?: string;
  notes?: string;
  active: boolean;
}

export interface AllocationAddOn {
  id: number;
  name: string;
  quantity: number;
  imageUrl?: string | null;
  note?: string | null;
  tailorCommission?: number | null;
}

export interface WorkAllocationItem {
  garmentId: number;
  orderId: number;
  orderDate?: string | null;
  sampleBookPageNumber?: string | null;
  garmentIndexInOrder: number;
  totalGarmentsInOrder: number;
  customerName: string;
  customerPhone?: string | null;
  serviceId?: number | null;
  serviceName: string;
  sampleNumber?: string | null;
  status: GarmentStatus;
  customerFabric?: boolean;
  tryDate?: string | null;
  dueDate?: string | null;
  note?: string | null;
  cuttingByWorkerId?: number | null;
  cuttingByWorkerName?: string | null;
  madeByWorkerId?: number | null;
  madeByWorkerName?: string | null;
  madeByWorkerPhone?: string | null;
  madeByWorkerImage?: string | null;
  madeByWorkerSpecialty?: string | null;
  addOns?: AllocationAddOn[];
  garmentPrice?: number;
  tailorCommission?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface AllocateWorkRequest {
  workerId: number;
  garmentIds: number[];
  note?: string;
}

export const WORKER_SPECIALTIES: {
  value: WorkerSpecialty;
  label: string;
  icon: string;
  badgeClass: string;
}[] = [
  {
    value: "STITCHING",
    label: "Stitching Tailor",
    icon: "🪡",
    badgeClass:
      "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  {
    value: "CUTTING",
    label: "Cutting Master",
    icon: "✂️",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    value: "IRONING",
    label: "Ironing & Press",
    icon: "♨️",
    badgeClass:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
  {
    value: "MASTER_TAILOR",
    label: "Master Tailor",
    icon: "👑",
    badgeClass:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  },
  {
    value: "ALTERATION",
    label: "Alteration Specialist",
    icon: "🧵",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
  {
    value: "FINISHING",
    label: "Finishing & Kaj-Button",
    icon: "✨",
    badgeClass:
      "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  },
];
