import axios from "axios";

import apiClient from "@/config/ApiClient";
import type { OrderGarment } from "@/components/orders/create/GarmentsStep";
import type {
  AdditionalChargeDraft,
  PaymentDraft,
} from "@/types/billing";
import type { MeasurementDraft } from "@/types/measurement";
import type {
  CompleteOrderChargeRequest,
  CompleteOrderRequest,
  CompleteOrderResponse,
  PaymentMethod,
} from "@/types/order";

const PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set([
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
]);

export interface SubmitOrderInput {
  customerId: number;
  authenticatedUserId: number;
  orderDate: string;
  sampleBookPageNumber: string;
  discount: number;
  garments: OrderGarment[];
  measurements: Record<string, MeasurementDraft>;
  additionalCharges: AdditionalChargeDraft[];
  payment: PaymentDraft;
  commonDueDate: string;
  lastValidDeliveryDate: string;
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function nullableText(value: string | undefined): string | null {
  return optionalText(value) ?? null;
}

/** Strict YYYY-MM-DD validation without accepting date rollovers such as 2026-02-30. */
export function isValidCalendarDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function requirePositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} is required.`);
  }
}

function resolveGarmentDueDate(
  garment: OrderGarment,
  garmentIndex: number,
  paymentDeliveryDate: string,
  commonDueDate: string,
  lastValidDeliveryDate: string,
): string {
  const candidates = [
    garment.dueDate,
    paymentDeliveryDate,
    commonDueDate,
    lastValidDeliveryDate,
  ];

  const dueDate = candidates.find(isValidCalendarDate);
  if (!dueDate) {
    throw new Error(
      `Please select a delivery date for garment ${garmentIndex + 1} (${garment.serviceName || "Garment"}).`,
    );
  }

  return dueDate;
}

function buildCharges(
  charges: AdditionalChargeDraft[],
): CompleteOrderChargeRequest[] {
  return charges.flatMap((charge) => {
    const description = optionalText(charge.description);
    const amount = Number(charge.amount);
    const isEmpty = !description && (!Number.isFinite(amount) || amount === 0);

    if (isEmpty) return [];
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Each additional charge needs a description and an amount greater than ₹0.");
    }

    return [{ description, amount }];
  });
}

function getFrontendBillableTotal(
  garments: OrderGarment[],
  charges: CompleteOrderChargeRequest[],
  discount: number,
): number {
  const garmentTotal = garments.reduce(
    (total, garment) => total + Math.max(0, Number(garment.price) || 0) + garment.addOns.reduce(
      (addOnTotal, addOn) => addOnTotal +
        Math.max(0, Number(addOn.price) || 0) * Number(addOn.quantity),
      0,
    ),
    0,
  );

  const chargesTotal = charges.reduce((total, charge) => total + charge.amount, 0);
  return Math.max(0, garmentTotal + chargesTotal - discount);
}

/** Converts the current order-page state into the one-call backend contract. */
export function buildCompleteOrderRequest(
  input: SubmitOrderInput,
): CompleteOrderRequest {
  requirePositiveSafeInteger(input.customerId, "A customer");
  requirePositiveSafeInteger(input.authenticatedUserId, "Your authenticated user ID");

  if (!isValidCalendarDate(input.orderDate)) {
    throw new Error("Please select a valid order date.");
  }
  if (input.garments.length === 0) {
    throw new Error("Add at least one garment.");
  }

  const discount = Number(input.discount);
  if (!Number.isFinite(discount) || discount < 0) {
    throw new Error("Order discount must be a valid non-negative amount.");
  }

  const additionalCharges = buildCharges(input.additionalCharges);

  const garments = input.garments.map((garment, index) => {
    requirePositiveSafeInteger(garment.serviceId ?? 0, `A tailoring service for garment ${index + 1}`);

    const price = Number(garment.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Enter a valid price for garment ${index + 1} (${garment.serviceName || "Garment"}).`);
    }

    const measurement = input.measurements[garment.localId];
    if (!measurement || Object.keys(measurement.measurementFields).length === 0) {
      throw new Error(`Enter or copy measurements for garment ${index + 1} (${garment.serviceName || "Garment"}).`);
    }

    const hasInvalidMeasurementValue = Object.values(measurement.measurementFields).some(
      (value) => value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && !Number.isFinite(value)),
    );
    if (hasInvalidMeasurementValue) {
      throw new Error(`Complete the measurement values for garment ${index + 1} (${garment.serviceName || "Garment"}).`);
    }

    const addOns = garment.addOns.map((addOn) => {
      requirePositiveSafeInteger(addOn.id, "An add-on ID");
      const quantity = Number(addOn.quantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error(`Add-on quantity must be at least 1 for garment ${index + 1}.`);
      }

      return {
        addOnId: addOn.id,
        quantity,
        note: nullableText(addOn.note),
      };
    });

    return {
      serviceId: garment.serviceId!,
      price,
      sampleNumber: optionalText(garment.sampleNumber),
      customerFabric: garment.customerFabric !== false, // default true (customer cloth / stitching only)

      dueDate: resolveGarmentDueDate(
        garment,
        index,
        input.payment.deliveryDate,
        input.commonDueDate,
        input.lastValidDeliveryDate,
      ),

      note: nullableText(garment.notes),

      measurement: {
        measurementId:
          measurement.sourceMeasurementId ?? null,

        measurementFields:
          measurement.measurementFields,

        alteration: {},

        note:
          nullableText(measurement.note),

        alterationNote:
          nullableText(measurement.alterationNote),

        editable: true,

        takenByUserId:
          input.authenticatedUserId,
      },

      addOns,
    };
  });

  const paymentAmount = Number(input.payment.advanceAmount);
  if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
    throw new Error("Payment amount must be a valid non-negative amount.");
  }

  const frontendTotal = getFrontendBillableTotal(input.garments, additionalCharges, discount);
  if (paymentAmount > frontendTotal) {
    throw new Error(`Advance payment cannot exceed the order total of ₹${frontendTotal.toFixed(2)}.`);
  }

  const payment = paymentAmount > 0
    ? (() => {
      if (!PAYMENT_METHODS.has(input.payment.paymentMethod)) {
        throw new Error("Select a valid payment method for the advance payment.");
      }

      return {
        amount: paymentAmount,
        paymentMethod: input.payment.paymentMethod,
        paymentType: "ADVANCE" as const,
        note: null,
        receivedById: input.authenticatedUserId,
      };
    })()
    : undefined;

  return {
    customerId: input.customerId,
    orderDate: input.orderDate,
    sampleBookPageNumber: optionalText(input.sampleBookPageNumber),
    discount,
    garments,
    additionalCharges,
    payment,
  };
}

/** Makes the single transactional write request for a complete order. */
export async function createCompleteOrder(
  request: CompleteOrderRequest,
): Promise<CompleteOrderResponse> {
  const response = await apiClient.post<CompleteOrderResponse>(
    "/orders/complete",
    request,
  );

  return response.data;
}

export async function submitOrder(
  input: SubmitOrderInput,
): Promise<CompleteOrderResponse> {
  return createCompleteOrder(buildCompleteOrderRequest(input));
}

export function getOrderSubmissionErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Unable to create the order. Your draft has been kept. Please try again.";
  }

  const data = error.response?.data;
  if (data && typeof data === "object") {
    const message = "message" in data ? data.message : undefined;
    if (typeof message === "string" && message.trim()) return message;

    const detail = "detail" in data ? data.detail : undefined;
    if (typeof detail === "string" && detail.trim()) return detail;
  }

  if (!error.response) {
    return "Unable to confirm whether the order was created. Please check the orders list before trying again.";
  }

  switch (error.response.status) {
    case 400:
      return "Order information is invalid. Please check the highlighted fields.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to create this order.";
    case 404:
      return "One of the selected resources could not be found. Please refresh and try again.";
    case 409:
      return "The order request was already processed or conflicts with an existing order.";
    default:
      return "Something went wrong while creating the order. Please try again.";
  }
}
