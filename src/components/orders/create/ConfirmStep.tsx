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
  submitting: boolean;
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
  submitting,
  onBack,
  onConfirm,
}: ConfirmStepProps) {
  const additionalCharges = billing.additionalCharges.reduce(
    (sum, charge) => sum + Number(charge.amount || 0),
    0,
  );
  const grandTotal = Math.max(0, subtotal + additionalCharges - billing.discount);
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/30">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Confirm Order</h2>
          <p className="text-sm text-muted-foreground">
            Check the order details before creating it.
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
          <span className="text-sm text-muted-foreground">Discount</span>
          <span className="text-sm font-medium">{currency(billing.discount)}</span>
        </div>

        <div className="flex justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Advance ({billing.paymentMethod})</span>
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
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-5">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </section>
  );
}
