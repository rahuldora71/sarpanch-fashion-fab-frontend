export const GARMENT_STATUSES = [
  "FABRIC_CUT",
  "WASHING",
  "CUTTING",
  "STITCHING",
  "IRONING",
  "READY",
  "DELIVERED",
  "ALTERATION",
  "CANCELLED",
] as const;

export type GarmentStatus = (typeof GARMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "DRAFT", "CONFIRMED", "CUTTING", "STITCHING", "FINISHING",
  "QUALITY_CHECK", "ALTERATION", "READY", "DELIVERED", "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderRequest {
  customerId: number;
  orderDate: string;
  sampleBookPageNumber?: string;
}

export interface OrderResponse {
  id: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  orderDate: string;
  sampleBookPageNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  garmentCount: number;
  total: number;
  due: number;
  createdAt: string;
  deliveryDate: string;
  status: any;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  content: T[];
  empty: boolean;
}

export interface OrderPageParams {
  page?: number;
  size?: number;
  sort?: string;
}
export interface SelectedOrderAddOn {
  id: number;
  name: string;
  price: number;
  tailorCommission: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string | null;
  beforeCutting?: boolean;
  note?: string;
}

export interface GarmentAddOnValue {
  id: number;
  name: string;
  price: number;
  tailorCommission: number;
  quantity: number;
  imageUrl?: string | null;
  beforeCutting: boolean;
  note?: string;
  totalPrice: number;
}

export interface GarmentFormValue {
  serviceId: number | null;
  serviceName: string;
  price: number;

  /** Backend Garment.sampleNumber; defaults to the garment's position. */
  sampleNumber: string;
  sampleId: string;
  bookNumber: string;
  pageNumber: string;

  notes: string;

  addOns: GarmentAddOnValue[];

  dueDate?: string;
  individualDueDate?: boolean;
}

export interface OrderDraft {
  version: number;
  updatedAt: string;
  step: number;
  customer: any | null;
  garments: GarmentFormValue[];
  commonDueDate?: string;
  measurements: unknown | null;
  billing: unknown | null;
  orderDate?: string;
}

export interface GarmentStatusCount {
  status: GarmentStatus;
  count: number;
}
