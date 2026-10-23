// ============================================================
// ORDER EDIT & MULTI-CUSTOMER CHECKOUT TYPES
// ============================================================

import type { GarmentStatus } from "./cutting";

// Mirrors backend CompleteOrderResponse
export interface CompleteOrderResponse {
  orderId: number;
  customerId: number;
  customerName: string;
  sampleBookPageNumber?: string | null;
  orderDate: string;
  subtotal: number;
  additionalCharges: number;
  discount: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  garments: CreatedGarmentResponse[];
  createdAt: string;
}

export interface CreatedGarmentResponse {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string | null;
  measurementId: number;
  addOnIds: number[];
}

// ============================================================
// EDIT ORDER REQUEST (mirrors backend EditOrderRequestDto)
// ============================================================

export interface EditOrderMeasurementDto {
  measurementId?: number | null;
  takenByUserId: number;
  measurementFields: Record<string, string | number>;
  alteration?: Record<string, unknown>;
  note?: string;
  alterationNote?: string;
  editable?: boolean;
}

export interface EditOrderAddOnDto {
  addOnId: number;
  quantity?: number;
  note?: string;
}

export interface EditOrderGarmentDto {
  garmentId?: number | null;  // null = new garment
  serviceId: number;
  price?: number;
  sampleNumber?: string;
  dueDate: string;             // mandatory
  tryDate?: string;
  note?: string;
  customerFabric?: boolean;
  measurement: EditOrderMeasurementDto;
  addOns?: EditOrderAddOnDto[];
}

export interface EditOrderChargeDto {
  description: string;
  amount: number;
}

export interface EditOrderPaymentDto {
  amount: number;
  paymentMethod: string;
  paymentType: string;
  receivedById: number;
  note?: string;
}

export interface EditOrderRequestDto {
  orderDate: string;
  sampleBookPageNumber?: string;
  discount?: number;
  garments: EditOrderGarmentDto[];
  additionalCharges?: EditOrderChargeDto[];
  payment?: EditOrderPaymentDto;
}

// ============================================================
// MULTI-CUSTOMER CHECKOUT SESSION
// Stored in Redux. One entry per customer order draft.
// ============================================================

export interface CheckoutGarmentDraft {
  tempId: string;            // local UUID for tracking
  garmentId?: number;        // if editing existing garment
  serviceId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string;
  dueDate: string;
  tryDate?: string;
  note?: string;
  measurement: EditOrderMeasurementDto;
  addOns: EditOrderAddOnDto[];
  status?: GarmentStatus;    // present when editing existing
}

export interface CheckoutChargeDraft {
  tempId: string;
  description: string;
  amount: number;
}

export interface CustomerOrderDraft {
  sessionId: string;          // local UUID
  customerId: number;
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  orderDate: string;
  sampleBookPageNumber: string;
  discount: number;
  garments: CheckoutGarmentDraft[];
  additionalCharges: CheckoutChargeDraft[];
  subtotal: number;
  grandTotal: number;
  paymentAmount: number;
  paymentMethod: string;
  paymentType: string;
  receivedById?: number;
  paymentNote?: string;
}

export interface MultiCustomerCheckoutState {
  sessions: CustomerOrderDraft[];
  activeSessionId: string | null;
  confirmedOrders: CompleteOrderResponse[];
  isSubmitting: boolean;
}
