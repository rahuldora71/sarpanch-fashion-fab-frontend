import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Wallet,
  Calendar,
  X,
  Coins,
  FileText,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import type { Worker } from "@/types/worker";
import { saveWorkerAdvance } from "@/services/workerStatementService";

interface WorkerAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  selectedWorkerId?: number;
  onAdvanceAdded: () => void;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];
const QUICK_NOTES = ["चाय-नाश्ता", "घर खर्च", "किराया", "दवाई", "दैनिक खर्च"];

export function WorkerAdvanceDialog({
  open,
  onOpenChange,
  workers,
  selectedWorkerId,
  onAdvanceAdded,
}: WorkerAdvanceDialogProps) {
  const [workerId, setWorkerId] = useState<number | "">("");
  const [amount, setAmount] = useState<string>("");
  const [advanceDate, setAdvanceDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [type, setType] = useState<string>("DAILY_KHARCHA");
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedWorkerId) {
      setWorkerId(selectedWorkerId);
    } else if (workers.length > 0 && !workerId) {
      setWorkerId(workers[0].id);
    }
  }, [selectedWorkerId, workers, workerId]);

  if (!open) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
  };

  const handleAddAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!workerId) {
      toast.error("Please select a worker");
      return;
    }
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      await saveWorkerAdvance({
        workerId: Number(workerId),
        amount: numAmount,
        advanceDate,
        type,
        paymentMode,
        note: note.trim() || undefined,
      });

      const worker = workers.find((w) => w.id === Number(workerId));
      toast.success(
        `Recorded ₹${numAmount.toLocaleString("en-IN")} advance for ${
          worker?.name || "worker"
        }`
      );
      setAmount("");
      setNote("");
      onAdvanceAdded();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save advance:", err);
      toast.error("Failed to record advance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                Add Daily Kharcha / Advance (दैनिक खर्चा)
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Record cash or UPI payment given to worker
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

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {/* WORKER SELECT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Select Worker (कारीगर)
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.workerSpecialty || "Tailor"}) &bull; {w.phone}
                </option>
              ))}
            </select>
          </div>

          {/* AMOUNT INPUT & QUICK CHIPS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Amount (राशि ₹)</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Quick tap to set or add
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                placeholder="Enter amount (e.g. 200, 500)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-base font-extrabold rounded-xl h-11"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border cursor-pointer"
                >
                  ₹{val}
                </button>
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">or add:</span>
              <button
                type="button"
                onClick={() => handleAddAmount(100)}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 cursor-pointer"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(500)}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 cursor-pointer"
              >
                +500
              </button>
            </div>
          </div>

          {/* DATE & PAYMENT MODE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Date (तारीख)
              </label>
              <Input
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-primary" />
                Mode (माध्यम)
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

          {/* TYPE SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Expense Category (खर्चा प्रकार)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("DAILY_KHARCHA")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                  type === "DAILY_KHARCHA"
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                ☕ दैनिक खर्चा (Daily Kharcha)
              </button>
              <button
                type="button"
                onClick={() => setType("ADVANCE")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                  type === "ADVANCE"
                    ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                💵 पेशगी / एडवांस (Advance)
              </button>
            </div>
          </div>

          {/* NOTE / REASON */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Note / Reason (वजह / विवरण)
            </label>
            <Input
              placeholder="e.g. चाय नाश्ता, घर खर्च, दवाई..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {QUICK_NOTES.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  {qn}
                </button>
              ))}
            </div>
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
              className="rounded-xl font-bold gap-1.5 shadow-xs"
            >
              <IndianRupee className="w-4 h-4" />
              {saving ? "Saving..." : "Record Kharcha"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
