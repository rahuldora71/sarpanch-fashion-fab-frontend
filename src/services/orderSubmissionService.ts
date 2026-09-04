/**
 * Order submission workflow
 *
 * This is the one place to edit when the order-create API flow changes.
 * Change payload builders below, or append new calls after `createOrder` when
 * the backend adds garment / garment-measurement / garment-add-on endpoints.
 */
import type { OrderGarment } from "@/components/orders/create/GarmentsStep";
import { orderService } from "@/services/orderService";
import type { BillingDraft } from "@/types/billing";
import type { MeasurementDraft } from "@/types/measurement";
import type { OrderResponse } from "@/types/order";

export interface SubmitOrderInput {
  customerId: number;
  orderDate: string;
  garments: OrderGarment[];
  measurements: Record<string, MeasurementDraft>;
  billing: BillingDraft;
}

export interface SubmitOrderResult {
  order: OrderResponse;
  garmentIds: number[];
}

export async function submitOrder({
  customerId,
  orderDate,
  garments,
  measurements,
  billing,
}: SubmitOrderInput): Promise<SubmitOrderResult> {
  // 1. Create the root order record.
  const order = await orderService.createOrder({
    customerId,
    orderDate,
    sampleBookPageNumber: garments[0]?.pageNumber.trim() || "",
  });

  // 2. Each garment must exist before its add-ons and measurement snapshot.
  // A copied/latest measurement is intentionally saved as a new *garment*
  // snapshot, not as another record in the customer measurement-history table.
  const garmentIds: number[] = [];

  for (const garment of garments) {
    if (!garment.serviceId) {
      throw new Error("Every garment must have a tailoring service.");
    }

    const createdGarment = await orderService.createGarment({
      orderId: order.id,
      serviceId: garment.serviceId,
      sampleNumber: garment.sampleNumber.trim() || undefined,
      customerFabric: Boolean(garment.sampleId.trim()),
      dueDate: garment.dueDate || billing.deliveryDate || undefined,
      note: garment.notes.trim() || undefined,
    });
    garmentIds.push(createdGarment.id);

    await Promise.all(
      garment.addOns.map((addOn) =>
        orderService.addGarmentAddOn({
          garmentId: createdGarment.id,
          addOnId: addOn.id,
          quantity: Math.max(1, Number(addOn.quantity) || 1),
          note: addOn.note?.trim() || undefined,
        }),
      ),
    );

    const measurement = measurements[garment.localId];
    if (measurement && Object.keys(measurement.measurementFields).length > 0) {
      await orderService.createGarmentMeasurement({
        garmentId: createdGarment.id,
        measurementFields: measurement.measurementFields,
        alteration: {},
        note: measurement.note || undefined,
        alterationNote: measurement.alterationNote || undefined,
        editable: true,
      });
    }
  }

  // 3. Charges must exist before a payment: the backend validates payments
  // against its stored outstanding balance.
  const validCharges = billing.additionalCharges.filter(
    (charge) => charge.description.trim() && Number(charge.amount) > 0,
  );

  await Promise.all(
    validCharges.map((charge) =>
      orderService.addCharge(order.id, {
        description: charge.description.trim(),
        amount: Number(charge.amount),
      }),
    ),
  );

  const advanceAmount = Number(billing.advanceAmount);
  if (advanceAmount > 0) {
    await orderService.createPayment({
      orderId: order.id,
      amount: advanceAmount,
      paymentMethod: billing.paymentMethod,
      paymentType: "ADVANCE",
      paidAt: new Date().toISOString(),
    });
  }

  return { order, garmentIds };
}
