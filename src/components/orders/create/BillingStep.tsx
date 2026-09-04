import {
  useMemo,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Button,
} from "@/components/ui/button";

import {
  Separator,
} from "@/components/ui/separator";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  BILLING_PAYMENT_METHODS,
  type BillingDraft,
  type BillingPaymentMethod,
  type AdditionalChargeDraft,
  type BillingSummaryItem,
} from "@/types/billing";

import {
  BILLING_CONSTANTS,
} from "@/constants/billing";
interface BillingStepProps {
  items: BillingSummaryItem[];
  billing: BillingDraft;
  orderDate: string;
  deliveryDate: string;
  onChange: (billing: BillingDraft) => void;
  onOrderDateChange: (value: string) => void;
}

const PAYMENT_METHOD_LABELS: Record<
  BillingPaymentMethod,
  string
> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function createCharge(): AdditionalChargeDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: 0,
  };
}

export function BillingStep({
  items,
  billing,
  orderDate,
  deliveryDate,
  onChange,
  onOrderDateChange,
}: BillingStepProps) {
  /* =========================================================
     SUBTOTAL
     ========================================================= */

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );
  }, [items]);

  /* =========================================================
     ADDITIONAL CHARGES
     ========================================================= */

  const additionalChargesTotal = useMemo(() => {
    return billing.additionalCharges.reduce(
      (sum, charge) =>
        sum + Number(charge.amount || 0),
      0,
    );
  }, [billing.additionalCharges]);

  /* =========================================================
     GRAND TOTAL
     ========================================================= */

  const grandTotal = useMemo(() => {
    return Math.max(
      0,
      subtotal +
      additionalChargesTotal -
      Number(billing.discount || 0),
    );
  }, [
    subtotal,
    additionalChargesTotal,
    billing.discount,
  ]);

  /* =========================================================
     MINIMUM ADVANCE — 70%
     ========================================================= */

  const minimumAdvance = useMemo(() => {
    return (
      grandTotal *
      (BILLING_CONSTANTS.MINIMUM_ADVANCE_PERCENTAGE /
        100)
    );
  }, [grandTotal]);

  /* =========================================================
     ADVANCE
     ========================================================= */

  const advanceAmount = Math.min(
    Math.max(
      0,
      Number(billing.advanceAmount || 0),
    ),
    grandTotal,
  );

  /* =========================================================
     BALANCE
     ========================================================= */

  const balanceDue = Math.max(
    0,
    grandTotal - advanceAmount,
  );

  /* =========================================================
     ADVANCE STATUS
     ========================================================= */

  const advanceBelowMinimum =
    advanceAmount > 0 &&
    advanceAmount < minimumAdvance;

  /* =========================================================
     UPDATE BILLING
     ========================================================= */

  const updateBilling = (
    patch: Partial<BillingDraft>,
  ) => {
    onChange({
      ...billing,
      ...patch,
    });
  };

  /* =========================================================
     DISCOUNT
     ========================================================= */

  const handleDiscountChange = (
    value: string,
  ) => {
    const amount = Number(value);

    updateBilling({
      discount:
        Number.isFinite(amount) && amount >= 0
          ? amount
          : 0,
    });
  };

  /* =========================================================
     ADVANCE
     ========================================================= */

  const handleAdvanceChange = (
    value: string,
  ) => {
    const amount = Number(value);

    updateBilling({
      advanceAmount:
        Number.isFinite(amount) && amount >= 0
          ? Math.min(amount, grandTotal)
          : 0,
    });
  };

  /* =========================================================
     ADDITIONAL CHARGE
     ========================================================= */

  const addAdditionalCharge = () => {
    updateBilling({
      additionalCharges: [
        ...billing.additionalCharges,
        createCharge(),
      ],
    });
  };

  const updateAdditionalCharge = (
    id: string,
    patch: Partial<AdditionalChargeDraft>,
  ) => {
    updateBilling({
      additionalCharges:
        billing.additionalCharges.map(
          (charge) =>
            charge.id === id
              ? {
                ...charge,
                ...patch,
              }
              : charge,
        ),
    });
  };

  const removeAdditionalCharge = (
    id: string,
  ) => {
    updateBilling({
      additionalCharges:
        billing.additionalCharges.filter(
          (charge) => charge.id !== id,
        ),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">

      {/* =====================================================
          LEFT — ORDER SUMMARY
      ====================================================== */}

      <Card className="overflow-hidden border-border/70 shadow-sm">

        <CardHeader className="border-b bg-muted/20 px-5 py-4">

          <div className="flex items-center justify-between">

            <div>
              <CardTitle className="text-base">
                Order Summary
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                Review garments and additional charges
              </p>
            </div>

            <Badge variant="secondary">
              {items.length}{" "}
              {items.length === 1
                ? "Garment"
                : "Garments"}
            </Badge>

          </div>

        </CardHeader>

        <CardContent className="space-y-5 p-5">

          {/* =================================================
              GARMENTS
          ================================================== */}

          <div className="space-y-4">

            {items.length === 0 ? (

              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No garments have been added.
              </div>

            ) : (

              items.map((item) => (

                <div
                  key={item.garmentNumber}
                  className="space-y-2"
                >

                  {/* Garment Header */}

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2">

                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        #{item.garmentNumber}
                      </span>

                      <span className="font-medium">
                        {item.garmentName}
                      </span>

                    </div>

                    <span className="font-semibold">
                      {formatCurrency(item.price)}
                    </span>

                  </div>

                  {/* Add-ons */}

                  {item.addOns.length > 0 && (

                    <div className="ml-9 space-y-1.5">

                      <p className="text-xs font-medium text-muted-foreground">
                        Add-ons
                      </p>

                      {item.addOns.map(
                        (addOn, index) => (

                          <div
                            key={`${item.garmentNumber}-${index}`}
                            className="flex items-center justify-between text-sm"
                          >

                            <span className="text-muted-foreground">
                              {addOn.name}
                            </span>

                            <span>
                              {formatCurrency(
                                addOn.price,
                              )}
                            </span>

                          </div>

                        ),
                      )}

                    </div>

                  )}

                </div>

              ))

            )}

          </div>

          <Separator />

          {/* =================================================
              ADDITIONAL CHARGES
          ================================================== */}

          <div className="space-y-3">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-sm font-semibold">
                  Additional Charges
                </h3>

                <p className="text-xs text-muted-foreground">
                  Extra charges outside garment pricing
                </p>

              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdditionalCharge}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add
              </Button>

            </div>

            {billing.additionalCharges.length === 0 ? (

              <div className="rounded-lg border border-dashed p-4 text-center">

                <p className="text-sm text-muted-foreground">
                  No additional charges
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={addAdditionalCharge}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add a charge
                </Button>

              </div>

            ) : (

              <div className="space-y-2">

                {billing.additionalCharges.map(
                  (charge) => (

                    <div
                      key={charge.id}
                      className="rounded-lg border bg-muted/10 p-3"
                    >

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">

                        {/* Charge Name */}

                        <div className="space-y-1.5">

                          <Label className="text-xs">
                            Charge name
                          </Label>

                          <Input
                            value={charge.description}
                            placeholder="Coat cover"
                            onChange={(event) =>
                              updateAdditionalCharge(
                                charge.id,
                                {
                                  description:
                                    event.target.value,
                                },
                              )
                            }
                          />

                        </div>

                        {/* Amount */}

                        <div className="space-y-1.5">

                          <Label className="text-xs">
                            Amount
                          </Label>

                          <div className="relative">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              ₹
                            </span>

                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="pl-7"
                              value={
                                charge.amount || ""
                              }
                              onChange={(event) =>
                                updateAdditionalCharge(
                                  charge.id,
                                  {
                                    amount:
                                      Number(
                                        event.target
                                          .value,
                                      ) || 0,
                                  },
                                )
                              }
                            />

                          </div>

                        </div>

                        {/* Remove */}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            removeAdditionalCharge(
                              charge.id,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </div>

                    </div>

                  ),
                )}

              </div>

            )}

          </div>

          <Separator />

          {/* =================================================
              TOTALS
          ================================================== */}

          <div className="space-y-3">

            {/* Subtotal */}

            <div className="flex items-center justify-between text-sm">

              <span className="text-muted-foreground">
                Subtotal
              </span>

              <span className="font-medium">
                {formatCurrency(subtotal)}
              </span>

            </div>

            {/* Additional Charges */}

            {additionalChargesTotal > 0 && (

              <div className="flex items-center justify-between text-sm">

                <span className="text-muted-foreground">
                  Additional charges
                </span>

                <span className="font-medium">
                  +{" "}
                  {formatCurrency(
                    additionalChargesTotal,
                  )}
                </span>

              </div>

            )}

            {/* Discount */}

            <div className="flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/20">

              <Label
                htmlFor="discount"
                className="font-medium"
              >
                Discount
              </Label>

              <div className="relative w-36">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>

                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  className="border-emerald-200 bg-background pl-7 text-right dark:border-emerald-900"
                  value={
                    billing.discount || ""
                  }
                  onChange={(event) =>
                    handleDiscountChange(
                      event.target.value,
                    )
                  }
                />

              </div>

            </div>

            {/* Grand Total */}

            <div className="flex items-center justify-between pt-1">

              <span className="text-base font-semibold">
                Grand Total
              </span>

              <span className="text-xl font-bold">
                {formatCurrency(grandTotal)}
              </span>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* =====================================================
          RIGHT — PAYMENT
      ====================================================== */}

      <Card className="h-fit border-border/70 shadow-sm">

        <CardHeader className="border-b bg-muted/20 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <WalletCards className="h-5 w-5 text-primary" />
            </div>

            <div>

              <CardTitle className="text-base">
                Advance Payment
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                Record the amount received today
              </p>

            </div>

          </div>

        </CardHeader>

        <CardContent className="space-y-5 p-5">

          {/* =================================================
              ADVANCE AMOUNT
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="advanceAmount">
              Advance Amount
            </Label>

            <div className="relative">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>

              <Input
                id="advanceAmount"
                type="number"
                min={0}
                max={grandTotal}
                step="0.01"
                className="pl-7 text-base"
                value={
                  billing.advanceAmount || ""
                }
                onChange={(event) =>
                  handleAdvanceChange(
                    event.target.value,
                  )
                }
              />

            </div>

            {/* Recommended / Maximum */}

            <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">

              <span className="text-amber-700 dark:text-amber-400">

                Recommended minimum:{" "}

                <span className="font-semibold">
                  {formatCurrency(
                    minimumAdvance,
                  )}
                </span>

              </span>

              <span className="text-muted-foreground">
                Maximum:{" "}
                {formatCurrency(grandTotal)}
              </span>

            </div>

          </div>

          {/* =================================================
              PAYMENT METHOD
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="paymentMethod">
              Payment Method
            </Label>

            <div className="relative">

              <select
                id="paymentMethod"
                value={billing.paymentMethod}
                onChange={(event) =>
                  updateBilling({
                    paymentMethod:
                      event.target
                        .value as BillingPaymentMethod,
                  })
                }
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >

                {BILLING_PAYMENT_METHODS.map(
                  (method) => (

                    <option
                      key={method}
                      value={method}
                    >
                      {
                        PAYMENT_METHOD_LABELS[
                        method
                        ]
                      }
                    </option>

                  ),
                )}

              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />

            </div>

          </div>

          {/* =================================================
              ORDER DATE
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="orderDate">
              Order Date <span className="text-destructive">*</span>
            </Label>

            <div className="relative">

              <Input
                id="orderDate"
                type="date"
                required
                value={orderDate}
                onChange={(event) => onOrderDateChange(event.target.value)}
                className="pr-10"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            </div>

          </div>

          {/* =================================================
              DELIVERY DATE
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="deliveryDate">
              Delivery Date
            </Label>

            <div className="relative">

              <Input
                id="deliveryDate"
                type="date"
                value={billing.deliveryDate || deliveryDate}
                onChange={(event) =>
                  updateBilling({
                    deliveryDate: event.target.value,
                  })
                }
                className="pr-10"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            </div>

          </div>

          <Separator />

          {/* =================================================
              PAYMENT SUMMARY
          ================================================== */}

          <div className="space-y-3">

            {/* Grand Total */}

            <div className="flex items-center justify-between text-sm">

              <span className="text-muted-foreground">
                Grand Total
              </span>

              <span className="font-semibold">
                {formatCurrency(grandTotal)}
              </span>

            </div>

            {/* Minimum Advance */}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">

              <div className="flex items-center justify-between gap-3">

                <div>

                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Minimum Advance
                  </p>

                  <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
                    {
                      BILLING_CONSTANTS.MINIMUM_ADVANCE_PERCENTAGE
                    }
                    % of total billing amount
                  </p>

                </div>

                <span className="text-lg font-bold text-amber-800 dark:text-amber-300">
                  {formatCurrency(
                    minimumAdvance,
                  )}
                </span>

              </div>

            </div>

            {/* Advance Received */}

            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/20">

              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Advance Received
              </span>

              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(
                  advanceAmount,
                )}
              </span>

            </div>

            {/* Below Minimum Warning */}

            {advanceBelowMinimum && (

              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">

                <p className="text-xs text-destructive">

                  Advance is below the recommended{" "}
                  {
                    BILLING_CONSTANTS.MINIMUM_ADVANCE_PERCENTAGE
                  }
                  %.

                  <span className="ml-1 font-semibold">
                    Suggested minimum:{" "}
                    {formatCurrency(
                      minimumAdvance,
                    )}
                  </span>

                </p>

              </div>

            )}

            {/* No Advance */}

            {advanceAmount === 0 && (

              <div className="rounded-md border border-dashed px-3 py-2">

                <p className="text-xs leading-5 text-muted-foreground">
                  No advance has been entered.
                  Recommended minimum advance is{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(
                      minimumAdvance,
                    )}
                  </span>
                  .
                </p>

              </div>

            )}

            {/* Balance Due */}

            <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-3 dark:bg-orange-950/20">

              <span className="font-semibold text-orange-700 dark:text-orange-400">
                Balance Due
              </span>

              <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {formatCurrency(balanceDue)}
              </span>

            </div>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}
