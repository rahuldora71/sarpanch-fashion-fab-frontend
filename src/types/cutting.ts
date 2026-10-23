// ============================================================
// CUTTING QUEUE TYPES
// Mirror the backend CuttingQueueResponse DTO exactly.
// ============================================================

export type GarmentStatus =
  | "FABRIC_CUT"
  | "CUTTING"
  | "WASHING"
  | "STITCHING"
  | "IRONING"
  | "READY"
  | "DELIVERED"
  | "ALTERATION"
  | "CANCELLED";

export interface CustomerInfo {
  customerId: number;
  customerCode: string;
  name: string;
  phone: string;
  image?: string | null;
}

export interface MeasurementInfo {
  measurementId: number;
  fields: Record<string, string | number>;
  note?: string | null;
  takenByUserId?: number | null;
  measuredAt?: string | null;
}

export interface AddOnInfo {
  garmentAddOnId: number;
  addOnId: number;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  beforeCutting: boolean;
  cuttingInstruction?: string | null;
  fabricMarkingNote?: string | null;
  note?: string | null;
}

export interface CuttingGarmentItem {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  status: GarmentStatus;
  customerFabric: boolean;
  dueDate?: string | null;
  tryDate?: string | null;
  note?: string | null;
  measurement?: MeasurementInfo | null;
  cuttingAddOns: AddOnInfo[];
  stitchingAddOns: AddOnInfo[];
  cuttingByUserId?: number | null;
  cuttingByUserName?: string | null;
  createdAt?: string | null;
}

export interface CuttingOrderGroup {
  orderId: number;
  sampleBookPageNumber?: string | null;
  orderDate?: string | null;
  customer: CustomerInfo;
  garmentCount: number;
  garments: CuttingGarmentItem[];
}

export interface CuttingDateGroup {
  dueDate?: string | null;
  dueDateLabel: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  garmentCount: number;
  orders: CuttingOrderGroup[];
}

export interface CuttingQueueResponse {
  dateGroups: CuttingDateGroup[];
  totalGarmentsPending: number;
  totalOrdersPending: number;
  fetchedAt: string;
}

// ============================================================
// CUTTING WORKSPACE TYPES
// ============================================================

export interface CuttingWorkspaceGarment {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  status: GarmentStatus;
  customerFabric: boolean;
  dueDate?: string | null;
  tryDate?: string | null;
  note?: string | null;
  pendingCutting: boolean;
  measurement?: MeasurementInfo | null;
  cuttingAddOns: AddOnInfo[];
  otherAddOns: AddOnInfo[];
  cuttingByUserId?: number | null;
  cuttingByUserName?: string | null;
  cutAt?: string | null;
}

export interface CuttingWorkspaceResponse {
  orderId: number;
  sampleBookPageNumber?: string | null;
  orderDate?: string | null;
  customer: CustomerInfo;
  garments: CuttingWorkspaceGarment[];
  fetchedAt: string;
}

// ============================================================
// MARK AS CUT REQUEST
// ============================================================

export interface MarkAsCutRequest {
  cuttingNote?: string;
  fabricMarkingConfirmation?: string;
  cuttingByUserId?: number;
}

// ============================================================
// GARMENT RESPONSE (after marking as cut)
// ============================================================

export interface GarmentResponse {
  garmentId: number;
  orderId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  measurementId?: number | null;
  status: GarmentStatus;
  customerFabric: boolean;
  tryDate?: string | null;
  dueDate?: string | null;
  cuttingById?: number | null;
  madeById?: number | null;
  deliveredById?: number | null;
  alterationDeliveryDate?: string | null;
  alterationNote?: string | null;
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ============================================================
// FILTER TABS
// ============================================================

export type CuttingQueueTab = "all" | "today" | "tomorrow" | "upcoming" | "overdue";
