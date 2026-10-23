import React, { useState, useEffect } from "react";
import {
  X,
  Repeat,
  Upload,
  Loader2,
  Trash2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { uploadImage } from "@/services/imageService";
import type { Expense, ExpenseCreateRequest, ExpenseUpdateRequest } from "@/types/expense";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/types/expense";

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreateRequest | ExpenseUpdateRequest) => Promise<void>;
  initialData?: Expense | null;
  defaultRecurring?: boolean;
}

export const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultRecurring = false,
}) => {
  const [category, setCategory] = useState<string>("MISCELLANEOUS");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isRecurring, setIsRecurring] = useState<boolean>(defaultRecurring);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paidTo, setPaidTo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptPublicId, setReceiptPublicId] = useState<string>("");

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || "MISCELLANEOUS");
      setDescription(initialData.description || "");
      setAmount(initialData.amount ? initialData.amount.toString() : "");
      setExpenseDate(initialData.expenseDate || new Date().toISOString().split("T")[0]);
      setIsRecurring(!!initialData.isRecurring);
      setRecurringDayOfMonth(initialData.recurringDayOfMonth || 1);
      setPaymentMethod(initialData.paymentMethod || "CASH");
      setPaidTo(initialData.paidTo || "");
      setNotes(initialData.notes || "");
      setReceiptUrl(initialData.receiptUrl || "");
      setReceiptPublicId(initialData.receiptPublicId || "");
    } else {
      setCategory("MISCELLANEOUS");
      setDescription("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(defaultRecurring);
      setRecurringDayOfMonth(1);
      setPaymentMethod("CASH");
      setPaidTo("");
      setNotes("");
      setReceiptUrl("");
      setReceiptPublicId("");
    }
  }, [initialData, defaultRecurring, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadImage(file);
      if (res?.imageUrl) {
        setReceiptUrl(res.imageUrl);
        setReceiptPublicId(res.publicId || "");
        toast.success("Receipt bill uploaded successfully!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload receipt image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount greater than 0");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description or purpose for the expense");
      return;
    }

    if (!expenseDate) {
      toast.error("Please select a valid expense date");
      return;
    }

    const payload: ExpenseCreateRequest = {
      category,
      description: description.trim(),
      amount: parsedAmount,
      expenseDate,
      isRecurring,
      recurringFrequency: isRecurring ? "MONTHLY" : undefined,
      recurringDayOfMonth: isRecurring ? Number(recurringDayOfMonth) : undefined,
      paymentMethod,
      paidTo: paidTo.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
      receiptPublicId: receiptPublicId || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {initialData ? "Edit Shop Expense" : "Record New Shop Expense"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {initialData
                  ? `Updating voucher #${initialData.expenseNumber}`
                  : "Add overheads, petty expenses, or supplies"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Category & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs h-9 rounded-xl border border-input bg-background text-foreground px-3 focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.labelHindi})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-xs h-9 rounded-xl font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Description / Purpose <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Shop rent for October, 20 Coats thread reels, Sewing machine oil..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-9 rounded-xl"
              required
            />
          </div>

          {/* Date, Paid To & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Paid To (Recipient)
              </label>
              <Input
                placeholder="e.g. Landlord, Supplier..."
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs h-9 rounded-xl border border-input bg-background text-foreground px-3 focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Monthly Overhead Toggle */}
          <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-foreground">
                    Happens Every Month (Recurring Overhead)
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Mark if this is a recurring monthly bill (Rent, Electricity, Maintenance, WiFi, etc.)
                  </p>
                </div>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex items-center gap-3">
                <label className="text-xs font-medium text-foreground whitespace-nowrap">
                  Due Day of Every Month:
                </label>
                <div className="flex items-center gap-2 w-36">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={recurringDayOfMonth}
                    onChange={(e) => setRecurringDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                    className="text-xs h-8 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">of month</span>
                </div>
              </div>
            )}
          </div>

          {/* Receipt Upload / Camera Capture */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Bill / Receipt Attachment (Optional)
            </label>
            {receiptUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20">
                <img
                  src={receiptUrl}
                  alt="Receipt Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="truncate text-xs flex-1">
                  <span className="font-semibold text-foreground block truncate">Receipt uploaded</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Attachment linked</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setReceiptUrl("");
                    setReceiptPublicId("");
                  }}
                  className="h-8 w-8 text-rose-500 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="border border-dashed border-border hover:border-primary rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/10">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Uploading receipt...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-primary" />
                        <span>Upload Receipt Photo or Scan</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Additional Notes (Optional)
            </label>
            <Input
              placeholder="Any remarks, invoice number from supplier, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploading}
              className="text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Save Changes" : "Record Expense"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
