import type { PaymentMethod } from "./order";

export interface HistoricalCustomerSummary {
  id: number;
  customerCode: string | null;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  address?: string | null;
  image?: string | null;
  totalOrders: number;
  totalSpent: number;
  currentBalance: number;
  lastOrderDate?: string | null;
}

export interface HistoricalOrderRequest {
  customerId?: number | null;
  name?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  orderNumber?: number;
  orderDate: string; // YYYY-MM-DD
  totalAmount: number;
  advancePayment?: number;
  paymentMethod?: PaymentMethod;
  isDelivered?: boolean;
  billImageUrl?: string;
  billImagePublicId?: string;
  notes?: string;
}

export interface HistoricalOrderResponse {
  orderId: number;
  orderNumber: number;
  orderDate: string;
  totalAmount: number;
  advancePayment: number;
  balanceDue: number;
  isDelivered: boolean;
  billImageUrl?: string | null;
  billImagePublicId?: string | null;
  paymentMethod?: PaymentMethod;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerCode: string;
  nextSuggestedOrderNumber: number;
}

export interface NextOrderNumberResponse {
  nextOrderNumber: number;
}
