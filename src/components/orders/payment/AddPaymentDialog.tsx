import { useMemo, useState } from "react";
import { IndianRupee, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { orderService } from "@/services/orderService";

import type {
  PaymentMethod,
  PaymentType,
} from "@/types/order";

interface AddPaymentDialogProps {
  orderId: number;
  balanceDue: number;
  receivedById: number;
  onPaymentAdded?: () => void | Promise<void>;
  disabled?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
];

const getPaymentMethodLabel = (
  method: PaymentMethod,
) => {
  switch (method) {
    case "CASH":
      return "Cash";

    case "UPI":
      return "UPI";

    case "CARD":
      return "Card";

    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "CHEQUE":
      return "Cheque";

    default:
      return method;
  }
};

const getPaymentTypeLabel = (
  type: PaymentType,
) => {
  switch (type) {
    case "PARTIAL":
      return "Partial Payment";

    case "FINAL":
      return "Final Payment";

    case "ADVANCE":
      return "Advance Payment";

    default:
      return type;
  }
};

export default function AddPaymentDialog({
  orderId,
  balanceDue,
  receivedById,
  onPaymentAdded,
  disabled = false,
}: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "">("");

  const [note, setNote] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  // =========================================================
  // CALCULATE PAYMENT TYPE
  // =========================================================

  const numericAmount = Number(amount);

  const paymentType = useMemo<
    PaymentType | null
  >(() => {
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      balanceDue <= 0
    ) {
      return null;
    }

    if (numericAmount < balanceDue) {
      return "PARTIAL";
    }

    if (numericAmount === balanceDue) {
      return "FINAL";
    }

    return null;
  }, [numericAmount, balanceDue]);

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    setAmount("");
    setPaymentMethod("");
    setNote("");
  };

  // =========================================================
  // CLOSE
  // =========================================================

  const handleOpenChange = (
    value: boolean,
  ) => {
    if (submitting) {
      return;
    }

    setOpen(value);

    if (!value) {
      resetForm();
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async () => {
    if (balanceDue <= 0) {
      toast.error(
        "This order has no outstanding balance.",
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error(
        "Enter a valid payment amount.",
      );
      return;
    }

    if (numericAmount > balanceDue) {
      toast.error(
        `Payment cannot exceed the balance of ₹${balanceDue.toLocaleString(
          "en-IN",
        )}.`,
      );
      return;
    }

    if (!paymentMethod) {
      toast.error(
        "Please select a payment method.",
      );
      return;
    }

    if (!paymentType) {
      toast.error(
        "Unable to determine payment type.",
      );
      return;
    }

    try {
      setSubmitting(true);

      await orderService.createPayment({
        orderId,
        amount: numericAmount,
        paymentMethod,
        paymentType,
        paidAt: new Date().toISOString(),
        note: note.trim() || null,
        receivedById,
      });

      toast.success(
        paymentType === "FINAL"
          ? "Final payment added successfully."
          : "Payment added successfully.",
      );

      setOpen(false);
      resetForm();

      await onPaymentAdded?.();
    } catch (error: any) {
      console.error(
        "Failed to add payment:",
        error,
      );

      const message =
        error?.response?.data?.message ||
        "Failed to add payment.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger render={
        
       <Button
          type="button"
          disabled={
            disabled ||
            balanceDue <= 0
          }
        >
          <Plus className="mr-2 size-4" />
          Add Payment
        </Button>
    } >
        
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Add Payment
          </DialogTitle>

          <DialogDescription>
            Add a payment received for this
            order. The payment type is determined
            automatically from the remaining
            balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* =================================================
              BALANCE
          ================================================= */}

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>

              <span className="text-lg font-bold text-foreground">
                ₹
                {balanceDue.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              </span>
            </div>
          </div>

          {/* =================================================
              AMOUNT
          ================================================= */}

          <div className="space-y-2">
            <label
              htmlFor="payment-amount"
              className="text-sm font-medium text-foreground"
            >
              Payment Amount
            </label>

            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="payment-amount"
                type="number"
                min="0.01"
                max={balanceDue}
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                placeholder="Enter amount"
                className="pl-9"
                disabled={submitting}
              />
            </div>

            {numericAmount > balanceDue && (
              <p className="text-sm text-destructive">
                Payment cannot exceed the
                outstanding balance.
              </p>
            )}
          </div>

          {/* =================================================
              PAYMENT TYPE
          ================================================= */}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Payment Type
            </label>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
              {paymentType ? (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {getPaymentTypeLabel(
                      paymentType,
                    )}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Automatic
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Enter a valid amount
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {paymentType === "FINAL"
                ? "This payment will clear the remaining balance."
                : paymentType === "PARTIAL"
                  ? "A balance will remain after this payment."
                  : "Payment type will be determined automatically."}
            </p>
          </div>

          {/* =================================================
              PAYMENT METHOD
          ================================================= */}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Payment Method
            </label>

            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(
                  value as PaymentMethod,
                )
              }
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>

              <SelectContent>
                {PAYMENT_METHODS.map(
                  (method) => (
                    <SelectItem
                      key={method}
                      value={method}
                    >
                      {getPaymentMethodLabel(
                        method,
                      )}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* =================================================
              NOTE
          ================================================= */}

          <div className="space-y-2">
            <label
              htmlFor="payment-note"
              className="text-sm font-medium text-foreground"
            >
              Note
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <Textarea
              id="payment-note"
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value,
                )
              }
              placeholder="Add a note about this payment..."
              rows={3}
              disabled={submitting}
            />
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              handleOpenChange(false)
            }
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() =>
              void handleSubmit()
            }
            disabled={
              submitting ||
              !paymentMethod ||
              !paymentType ||
              numericAmount <= 0 ||
              numericAmount > balanceDue
            }
          >
            {submitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}

            {paymentType === "FINAL"
              ? "Add Final Payment"
              : "Add Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}