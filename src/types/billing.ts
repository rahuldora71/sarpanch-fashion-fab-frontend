export const BILLING_PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
] as const;

export type BillingPaymentMethod =
  (typeof BILLING_PAYMENT_METHODS)[number];

export interface AdditionalChargeDraft {
  id: string;
  description: string;
  amount: number;
}

export interface BillingDraft {
  discount: number;
  advanceAmount: number;
  paymentMethod: BillingPaymentMethod;
  deliveryDate: string;
  additionalCharges: AdditionalChargeDraft[];
}

export interface BillingSummaryItem {
  garmentNumber: number;
  garmentName: string;
  price: number;
  addOns: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}
