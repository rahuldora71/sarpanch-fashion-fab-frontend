import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerSummary } from "@/models/Customer";
import type { GarmentFormValue } from "@/types/order";
import type { BillingDraft } from "@/types/billing";

interface ConfirmStepProps {
  customer: CustomerSummary | null;
  garments: GarmentFormValue[];
  commonDueDate: string;
  orderDate: string;
  subtotal: number;
  billing: BillingDraft;
  orderDiscount: number;
  submitting: boolean;
  isEditMode?: boolean;
  existingPaidTotal?: number;
  onBack: () => void;
  onConfirm: () => void;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ConfirmStep({
  customer,
  garments,
  commonDueDate,
  orderDate,
  subtotal,
  billing,
  orderDiscount,
  submitting,
  isEditMode = false,
  existingPaidTotal = 0,
  onBack,
  onConfirm,
}: ConfirmStepProps) {
  const additionalCharges = billing.additionalCharges.reduce(
    (sum, charge) => sum + Number(charge.amount || 0),
    0,
  );
  const grandTotal = Math.max(0, subtotal + additionalCharges - orderDiscount);
  const newPayment = Number(billing.advanceAmount || 0);
  const balanceDue = Math.max(0, grandTotal - existingPaidTotal - newPayment);

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/30">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Confirm Order Changes" : "Confirm Order"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Review the updated order details before saving changes."
              : "Check the order details before creating it."}
          </p>
        </div>
      </div>

      <div className="divide-y rounded-lg border">
        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Customer</span>
          <span className="text-right text-sm font-medium">
            {customer?.name || "Not selected"}
          </span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Additional charges</span>
          <span className="text-sm font-medium">{currency(additionalCharges)}</span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Order discount</span>
          <span className="text-sm font-medium">{currency(orderDiscount)}</span>
        </div>

        {isEditMode && existingPaidTotal > 0 && (
          <div className="flex justify-between gap-4 p-4 bg-muted/20">
            <span className="text-sm text-muted-foreground">Already Paid (Preserved)</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {currency(existingPaidTotal)}
            </span>
          </div>
        )}

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">
            {isEditMode
              ? `New Payment (${billing.paymentMethod})`
              : `Advance (${billing.paymentMethod})`}
          </span>
          <span className="text-sm font-medium">{currency(billing.advanceAmount)}</span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Garments</span>
          <span className="text-sm font-medium">{garments.length}</span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Order date</span>
          <span className="text-sm font-medium">{orderDate}</span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Due date</span>
          <span className="text-sm font-medium">
            {commonDueDate || "Not selected"}
          </span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm font-semibold">Grand total</span>
          <span className="text-lg font-bold">{currency(grandTotal)}</span>
        </div>

        {isEditMode && (
          <div className="flex justify-between gap-4 p-4 bg-orange-50/50 dark:bg-orange-950/10">
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Remaining Balance Due
            </span>
            <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
              {currency(balanceDue)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-5">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm} disabled={submitting}>
          {submitting
            ? isEditMode
              ? "Saving..."
              : "Creating..."
            : isEditMode
            ? "Save Changes"
            : "Create Order"}
        </Button>
      </div>
    </section>
  );
}
