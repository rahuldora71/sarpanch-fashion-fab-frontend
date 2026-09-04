/**
 * Order submission workflow
 *
 * This file maps the create-order form to the API endpoints in the supplied
 * OpenAPI specification. Keep endpoint calls here; UI components only manage
 * user input and do not need to know API payload shapes.
 */
import type { OrderGarment } from "@/components/orders/create/GarmentsStep";
import {
  aggregateOrderService,
  type AggregateOrderRequest,
} from "@/services/orderService";
import type { BillingDraft } from "@/types/billing";
import type { MeasurementDraft } from "@/types/measurement";
import axios from "axios";

const ORDER_LOG_PREFIX = "[Order API]";

function logRequest(endpoint: string, payload: unknown): void {
  console.groupCollapsed(`${ORDER_LOG_PREFIX} REQUEST ${endpoint}`);
  console.log("payload:", payload);
  console.groupEnd();
}

function logResponse(endpoint: string, response: unknown): void {
  console.groupCollapsed(`${ORDER_LOG_PREFIX} RESPONSE ${endpoint}`);
  console.log("data:", response);
  console.groupEnd();
}

function logFailure(endpoint: string, error: unknown): void {
  console.group(`${ORDER_LOG_PREFIX} FAILED ${endpoint}`);
  if (axios.isAxiosError(error)) {
    console.error("status:", error.response?.status);
    console.error("response:", error.response?.data);
  } else {
    console.error(error);
  }
  console.groupEnd();
}

export function getOrderSubmissionErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Unable to create the order. Your draft has been saved.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please sign in again, then retry creating the order.";
  }

  const response = error.response?.data;
  if (response && typeof response === "object") {
    const message = "message" in response ? response.message : undefined;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const detail = "detail" in response ? response.detail : undefined;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return "Unable to create the order. Your draft has been saved.";
}

export interface SubmitOrderInput {
  customerId: number;
  orderDate: string;
  garments: OrderGarment[];
  measurements: Record<string, MeasurementDraft>;
  billing: BillingDraft;
}

export interface SubmitOrderResult {
  order: { id: number; totalAmount: number; paidAmount: number; balanceAmount: number };
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function hasMeasurementValues(measurement: MeasurementDraft | undefined): boolean {
  return Boolean(measurement && Object.keys(measurement.measurementFields).length > 0);
}

/**
 * The aggregate order API requires an existing measurement version. A copied
 * measurement becomes a new version; newly entered values create a profile
 * and its first version.
 */
async function resolveMeasurementId(
  customerId: number,
  garment: OrderGarment,
  measurement: MeasurementDraft | undefined,
): Promise<number> {
  if (!measurement || !hasMeasurementValues(measurement)) {
    throw new Error(`Enter or copy measurements for ${garment.serviceName || "each garment"}.`);
  }

  const note = optionalText(measurement.note);
  if (measurement.sourceMeasurementId) {
    const version = await aggregateOrderService.createMeasurementVersionFromExisting(
      customerId,
      measurement.sourceMeasurementId,
      measurement.measurementFields,
      note,
    );
    return version.id;
  }

  const profileId = await aggregateOrderService.createMeasurementProfile(
    customerId,
    garment.serviceId!,
    `${garment.serviceName || "Garment"} measurements`,
  );
  const version = await aggregateOrderService.createMeasurementVersion(
    customerId,
    profileId,
    measurement.measurementFields,
    note,
  );
  return version.id;
}

export async function submitOrder({
  customerId,
  orderDate,
  garments,
  measurements,
  billing,
}: SubmitOrderInput): Promise<SubmitOrderResult> {
  console.group(`${ORDER_LOG_PREFIX} SUBMISSION START`);
  console.log("customerId:", customerId);
  console.log("orderDate:", orderDate);
  console.log("garment count:", garments.length);
  console.groupEnd();

  try {
    if (garments.some((garment) => !garment.serviceId)) {
      throw new Error("Every garment must have a tailoring service.");
    }

    const advanceAmount = Number(billing.advanceAmount);
    if (advanceAmount <= 0) {
      throw new Error("Enter an advance payment greater than ₹0.");
    }

    const aggregateGarments = await Promise.all(
      garments.map(async (garment) => ({
        serviceId: garment.serviceId!,
        sampleNumber: optionalText(garment.sampleNumber) ?? "1",
        dueDate: garment.dueDate || billing.deliveryDate,
        customerFabric: Boolean(optionalText(garment.sampleId)),
        measurementId: await resolveMeasurementId(
          customerId,
          garment,
          measurements[garment.localId],
        ),
        addOns: garment.addOns.map((addOn) => ({
          addOnId: addOn.id,
          quantity: Math.max(1, Number(addOn.quantity) || 1),
        })),
        note: optionalText(garment.notes),
      })),
    );

    if (aggregateGarments.some((garment) => !garment.dueDate)) {
      throw new Error("Set a due date for every garment before creating the order.");
    }

    const payload: AggregateOrderRequest = {
      customerId,
      orderDate,
      sampleBookPageNumber: optionalText(garments[0]?.pageNumber),
      garments: aggregateGarments as AggregateOrderRequest["garments"],
      additionalCharges: billing.additionalCharges
        .map((charge) => ({ description: optionalText(charge.description), amount: Number(charge.amount) }))
        .filter((charge): charge is { description: string; amount: number } => Boolean(charge.description) && charge.amount > 0),
      payment: { amount: advanceAmount, paymentMethod: billing.paymentMethod },
    };

    logRequest("POST /api/orders", payload);
    const order = await aggregateOrderService.createOrder(payload);
    logResponse("POST /api/orders", order);
    console.info(`${ORDER_LOG_PREFIX} SUBMISSION COMPLETE`, { orderId: order.id });
    return { order };
  } catch (error) {
    logFailure("order submission", error);
    throw error;
  }
}
