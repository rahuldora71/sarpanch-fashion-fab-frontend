import type { PaymentMethod, PaymentType } from "./order";

export interface PaymentTransaction {
  paymentId: number;
  orderId: number;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  customerCode?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paidAt: string;
  note?: string | null;
  receivedById?: number | null;
  receivedByUserId?: number | null;
  receivedByName?: string | null;
  receivedByUserName?: string | null;
  createdAt: string;
}

export interface PaymentAnalytics {
  todayTotal: number;
  todayCount: number;
  rangeTotal: number;
  rangeCount: number;
  methodBreakdown: Record<string, number>;
  deliveredUnpaidCount: number;
  deliveredUnpaidTotalBalance: number;
  // Aliases for compatibility
  todayTotalAmount?: number;
  todayPaymentCount?: number;
  rangeTotalAmount?: number;
  rangePaymentCount?: number;
  paymentMethodBreakdown?: Record<string, number>;
  deliveredUnpaidBalance?: number;
}

export interface DeliveredUnpaidOrder {
  orderId: number;
  orderDate: string;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  customerCode?: string | null;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  totalGarments: number;
  deliveredGarments: number;
  deliveryDate?: string | null;
}

export interface CreatePaymentPayload {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paidAt?: string;
  note?: string;
  receivedById: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
