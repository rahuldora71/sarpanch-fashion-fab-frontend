import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  X,
  Calendar,
  Coins,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import type {
  WorkerStatementData,
  WorkerSettlementRecord,
} from "@/types/workerStatement";
import { saveWorkerSettlement } from "@/services/workerStatementService";

interface WorkerSettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementData: WorkerStatementData | null;
  onSettled: (record: WorkerSettlementRecord) => void;
}

export function WorkerSettlementModal({
  open,
  onOpenChange,
  statementData,
  onSettled,
}: WorkerSettlementModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [settlementDate, setSettlementDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (statementData) {
      setAmountPaid(String(Math.max(0, statementData.netPayable)));
      setSettlementDate(
        statementData.settlementDate || format(new Date(), "yyyy-MM-dd")
      );
    }
  }, [statementData]);

  if (!open || !statementData) return null;

  const {
    worker,
    cycleLabel,
    startDate,
    endDate,
    totalGarmentsCount,
    grossEarnings,
    previousBalance,
    totalAdvances,
    netPayable,
    garmentsSummary,
  } = statementData;

  const numPaid = Number(amountPaid) || 0;
  const closingBalance = Math.round((netPayable - numPaid) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const breakdown = JSON.stringify(garmentsSummary);
      const record = await saveWorkerSettlement({
        workerId: worker.id,
        startDate,
        endDate,
        settlementDate,
        cycleLabel,
        totalGarmentsCount,
        grossWorkAmount: grossEarnings,
        previousBalance,
        totalAdvancesDeducted: totalAdvances,
        netPayable,
        amountPaid: numPaid,
        closingBalance,
        paymentMode,
        note: note.trim() || undefined,
        garmentBreakdownJson: breakdown,
      });

      toast.success(
        `Hisab settled for ${worker.name}! Payout: ₹${numPaid.toLocaleString(
          "en-IN"
        )}`
      );
      onSettled(record);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to settle statement:", err);
      toast.error("Failed to record settlement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-emerald-500/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                Settle & Record Payment (हिसाब चुकता)
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {worker.name} &bull; {cycleLabel}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* SUMMARY CARDS IN DIALOG */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border text-xs">
            <div>
              <span className="text-muted-foreground">Garments Completed:</span>
              <p className="font-extrabold text-foreground">{totalGarmentsCount} Pcs</p>
            </div>
            <div>
              <span className="text-muted-foreground">Gross Work Earnings:</span>
              <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                +₹{grossEarnings.toLocaleString("en-IN")}
              </p>
              {statementData.totalAddOnsCommission > 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  (Includes +₹{statementData.totalAddOnsCommission} Add-on work)
                </p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Previous Balance:</span>
              <p
                className={`font-extrabold ${
                  previousBalance >= 0 ? "text-foreground" : "text-rose-500"
                }`}
              >
                {previousBalance >= 0 ? "+" : ""}₹{previousBalance.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Advances / Kharcha:</span>
              <p className="font-extrabold text-rose-600 dark:text-rose-400">
                -₹{totalAdvances.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* NET PAYABLE HIGHLIGHT */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Total Net Payable (कुल देय हिसाब)
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400 font-medium">
                Previous + Gross - Advances
              </p>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{netPayable.toLocaleString("en-IN")}
            </p>
          </div>

          {/* PAYMENT FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Amount Paying Now (दी जाने वाली राशि ₹)</span>
                <button
                  type="button"
                  onClick={() => setAmountPaid(String(Math.max(0, netPayable)))}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Pay Full (₹{Math.max(0, netPayable)})
                </button>
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="pl-8 text-lg font-black rounded-xl h-11"
                  required
                />
              </div>
            </div>

            {/* CLOSING BALANCE CARRIED FORWARD */}
            <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground font-medium">
                  Remaining Balance Carried Forward:
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Will become Opening Balance in next cycle
                </p>
              </div>
              <span
                className={`text-sm font-extrabold ${
                  closingBalance === 0
                    ? "text-emerald-600"
                    : closingBalance > 0
                    ? "text-blue-600"
                    : "text-rose-600"
                }`}
              >
                ₹{closingBalance.toLocaleString("en-IN")}
              </span>
            </div>

            {/* DATE & PAYMENT MODE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Payout Date (भुगतान तारीख)
                </label>
                <Input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  Payment Mode (माध्यम)
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden"
                >
                  <option value="CASH">💵 नकद (CASH)</option>
                  <option value="UPI">📱 UPI / PhonePe / GPay</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* NOTE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Settlement Note (हिसाब टिप्पणी)
              </label>
              <Input
                placeholder="e.g. 10 तारीख का पूरा हिसाब चुकता किया गया..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            {/* ACTIONS */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="rounded-xl font-bold gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Finalizing..." : "Confirm & Settle Payout"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
