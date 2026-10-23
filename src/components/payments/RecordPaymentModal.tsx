import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  IndianRupee,
  Smartphone,
  Wallet,
  Building2,
  FileCheck2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { recordPayment } from "@/services/paymentService";
import type { PaymentMethod, PaymentType } from "@/types/order";
import toast from "react-hot-toast";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  customerName?: string;
  customerPhone?: string;
  balanceDue?: number;
  grandTotal?: number;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId: initialOrderId,
  customerName,
  customerPhone,
  balanceDue,
  grandTotal,
  onSuccess,
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [orderId, setOrderId] = useState<string>(
    initialOrderId ? String(initialOrderId) : ""
  );
  const [amount, setAmount] = useState<string>(
    balanceDue !== undefined && balanceDue > 0 ? String(balanceDue) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentType, setPaymentType] = useState<PaymentType>("FINAL");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOrderId(initialOrderId ? String(initialOrderId) : "");
      setAmount(balanceDue !== undefined && balanceDue > 0 ? String(balanceDue) : "");
      setPaymentMethod("CASH");
      // Default to FINAL if balance equals amount, or PARTIAL
      setPaymentType("FINAL");
      setNote("");
      setError(null);
    }
  }, [isOpen, initialOrderId, balanceDue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedOrderId = Number(orderId);
    if (!parsedOrderId || isNaN(parsedOrderId) || parsedOrderId <= 0) {
      setError("Please provide a valid Order ID.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (!currentUser || !currentUser.id) {
      setError("Session error: logged-in user identification not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      await recordPayment({
        orderId: parsedOrderId,
        amount: parsedAmount,
        paymentMethod,
        paymentType,
        note: note.trim() || undefined,
        receivedById: currentUser.id,
      });

      toast.success(
        `₹${parsedAmount.toLocaleString("en-IN")} recorded successfully for Order #${parsedOrderId}!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to record payment:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Failed to record payment. Please check order balance.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            Record Order Payment
          </DialogTitle>
        </DialogHeader>

        {customerName && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-950/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{customerName}</span>
              {customerPhone && (
                <span className="text-xs text-muted-foreground">{customerPhone}</span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              {grandTotal !== undefined && (
                <span className="text-muted-foreground">
                  Order Total:{" "}
                  <strong className="text-foreground">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
              {balanceDue !== undefined && (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Balance Due: ₹{balanceDue.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="orderId" className="text-xs font-semibold">
                Order ID *
              </Label>
              <Input
                id="orderId"
                type="number"
                placeholder="e.g. 1042"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={Boolean(initialOrderId) || loading}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-xs font-semibold">
                Amount (₹) *
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-7 font-bold text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  if (val) setPaymentMethod(val as PaymentMethod);
                }}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <span>Cash</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UPI">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      <span>UPI / QR</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Card / POS</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-600" />
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CHEQUE">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-amber-600" />
                      <span>Cheque</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Payment Type *</Label>
              <Select
                value={paymentType}
                onValueChange={(val) => {
                  if (val) setPaymentType(val as PaymentType);
                }}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="FINAL">Final Settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="text-xs font-semibold">
              Payment Remarks / Note
            </Label>
            <Textarea
              id="note"
              placeholder="e.g. Received via GPay txn #123456, or collected in cash at counter"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              className="mt-1 text-xs"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
            <span>Collected By:</span>
            <Badge variant="outline" className="font-semibold text-foreground">
              {currentUser?.name || "Current Staff"}
            </Badge>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Save Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default RecordPaymentModal;
