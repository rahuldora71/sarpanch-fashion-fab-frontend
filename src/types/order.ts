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

export const PAYMENT_TYPES = [
  "ADVANCE",
  "PARTIAL",
  "FINAL",
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export interface OrderRequest {
  customerId: number;
  orderDate: string;
  sampleBookPageNumber?: string;
  /** Order-level discount. This is not part of a payment. */
  discount?: number;
}

export interface OrderResponse {
  id: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  orderDate: string;
  sampleBookPageNumber?: string | null;
  discount?: number | null;
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
  garmentId?: number;
  status?: GarmentStatus;
  isLocked?: boolean;

  serviceId: number | null;
  serviceName: string;
  price: number;
  customerFabric?: boolean;

  /** Backend Garment.sampleNumber; defaults to the garment's position. */
  sampleNumber: string;

  notes: string;

  addOns: GarmentAddOnValue[];

  dueDate?: string;
  individualDueDate?: boolean;
}

export interface OrderDraft {
  version: number;
  updatedAt: string;
  sampleBookPageNumber?: string;
  discount?: number;
  step: number;
  customer: any | null;
  garments: GarmentFormValue[];
  commonDueDate?: string;
  measurements: unknown | null;
  payment: unknown | null;
  additionalCharges?: unknown | null;
  /** Last valid payment-step delivery date, retained when the input is cleared. */
  lastValidDeliveryDate?: string;
  /** Read-only compatibility for drafts saved before payment was renamed. */
  billing?: unknown | null;
  orderDate?: string;
}

export interface GarmentStatusCount {
  status: GarmentStatus;
  count: number;
}

export interface CompleteOrderMeasurementRequest {
  measurementId: number | null;
  measurementFields: Record<string, string | number | null>;
  alteration: Record<string, unknown>;
  sourceMeasurementId?: number | null;
  note: string | null;
  alterationNote: string | null;
  editable: boolean;
  takenByUserId: number;
}

export interface CompleteOrderAddOnRequest {
  addOnId: number;
  quantity: number;
  note: string | null;
}

export interface CompleteOrderGarmentRequest {
  serviceId: number;
  price: number;
  sampleNumber?: string;
  dueDate: string;
  note: string | null;
  customerFabric?: boolean;
  measurement: CompleteOrderMeasurementRequest;
  addOns: CompleteOrderAddOnRequest[];
}

export interface CompleteOrderChargeRequest {
  description: string;
  amount: number;
}

export interface CompleteOrderPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  note: string | null;
  receivedById: number;
}

export interface CompleteOrderRequest {
  customerId: number;
  orderDate: string;
  sampleBookPageNumber?: string;
  discount: number;
  garments: CompleteOrderGarmentRequest[];
  additionalCharges: CompleteOrderChargeRequest[];
  payment?: CompleteOrderPaymentRequest;
}

export interface CompleteOrderGarmentResponse {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  measurementId: number;
  garmentAddOnIds: number[];
}

export interface CompleteOrderResponse {
  orderId: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  orderDate: string;
  sampleBookPageNumber?: string | null;
  discount: number;
  subtotal: number;
  additionalCharges: number;
  grandTotal: number;
  paymentAmount: number;
  balanceDue: number;
  paymentMethod?: PaymentMethod | null;
  paymentType?: PaymentType | null;
  garments: CompleteOrderGarmentResponse[];
  createdAt: string;
}

export interface OrderCustomerDetails {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;
}

export interface OrderMeasurementDetails {
  measurementId: number;
  measurementFields: Record<string, unknown>;
  alteration?: Record<string, unknown>;
  takenByUserId?: number | null;
  editable?: boolean;
  note?: string | null;
  alterationNote?: string | null;
  measuredAt?: string | null;
}

export interface OrderAddOnDetails {
  garmentAddOnId: number;
  addOnId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string | null;
}

export interface OrderGarmentDetails {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  status: GarmentStatus;
  customerFabric?: boolean;
  tryDate?: string | null;
  dueDate?: string | null;
  alterationDeliveryDate?: string | null;
  alterationNote?: string | null;
  note?: string | null;
  cuttingByWorkerId?: number | null;
  cuttingByWorkerName?: string | null;
  madeByWorkerId?: number | null;
  madeByWorkerName?: string | null;
  madeByWorkerPhone?: string | null;
  madeByWorkerImage?: string | null;
  measurement?: OrderMeasurementDetails | null;
  addOns: OrderAddOnDetails[];
}

export interface OrderChargeDetails {
  chargeId: number;
  description: string;
  amount: number;
}

export interface OrderPaymentDetails {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  note?: string | null;
  receivedById?: number | null;
  createdAt?: string | null;
}

export interface OrderDetailsResponse {
  orderId: number;
  orderDate: string;
  sampleBookPageNumber?: string | null;

  customer: OrderCustomerDetails;

  subtotal: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;

  garments: OrderGarmentDetails[];
  charges: OrderChargeDetails[];
  payments: OrderPaymentDetails[];

  createdAt: string;
  updatedAt: string;
}

export interface OrderDeliveryRequest {
  garmentIds: number[];
  deliveredById?: number | null;
  deliveryNote?: string;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  paymentNote?: string;
}

export interface OrderDeliveryResponse {
  orderId: number;
  totalGarments: number;
  deliveredGarmentsCount: number;
  fullyDelivered: boolean;
  deliveredGarmentIds: number[];
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentRecorded: boolean;
  message: string;
}