import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subMonths, addMonths } from "date-fns";
import {
  UsersRound,
  Calendar,
  Wallet,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Scissors,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Settings2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import type { Worker, WorkAllocationItem } from "@/types/worker";
import type { GarmentStatus } from "@/types/order";
import type {
  WorkerAdvance,
  WorkerSettlementRecord,
  SettlementCyclePreset,
  WorkerStatementData,
} from "@/types/workerStatement";
import {
  getCycleRange,
  getCurrentCyclePreset,
  fetchWorkerAdvances,
  removeWorkerAdvance,
  fetchWorkerSettlements,
  getLatestClosingBalance,
  computeWorkerStatement,
  getCustomWorkerRates,
  saveCustomWorkerRates,
} from "@/services/workerStatementService";
import { getWorkAllocations } from "@/services/workerService";
import { WorkerAdvanceDialog } from "./WorkerAdvanceDialog";
import { WorkerSettlementModal } from "./WorkerSettlementModal";
import { WorkerStatementPrintDialog } from "./WorkerStatementPrintDialog";
import { garmentStatusColor, garmentStatusLabel } from "@/utils/productionUtils";

interface WorkerStatementTabProps {
  workers: Worker[];
  initialWorkerId?: number;
}

export function WorkerStatementTab({
  workers,
  initialWorkerId,
}: WorkerStatementTabProps) {
  // 1. WORKER SELECTION
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(
    initialWorkerId || (workers[0]?.id ?? 0)
  );

  useEffect(() => {
    if (initialWorkerId) {
      setSelectedWorkerId(initialWorkerId);
    } else if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [initialWorkerId, workers, selectedWorkerId]);

  const activeWorker = useMemo(() => {
    return workers.find((w) => w.id === selectedWorkerId) || workers[0] || null;
  }, [workers, selectedWorkerId]);

  // 2. CYCLE & DATE RANGE
  const [cyclePreset, setCyclePreset] = useState<SettlementCyclePreset>(
    getCurrentCyclePreset()
  );
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [customStart, setCustomStart] = useState<string>(
    format(new Date(), "yyyy-MM-01")
  );
  const [customEnd, setCustomEnd] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const cycleDetails = useMemo(() => {
    if (cyclePreset === "CUSTOM") {
      return {
        startDate: customStart,
        endDate: customEnd,
        settlementDate: format(new Date(), "yyyy-MM-dd"),
        label: `Custom Period (${format(new Date(customStart), "dd/MM")} – ${format(
          new Date(customEnd),
          "dd/MM/yyyy"
        )})`,
      };
    }
    return getCycleRange(cyclePreset, referenceDate);
  }, [cyclePreset, referenceDate, customStart, customEnd]);

  // 3. DATA STATES
  const [allocations, setAllocations] = useState<WorkAllocationItem[]>([]);
  const [advances, setAdvances] = useState<WorkerAdvance[]>([]);
  const [settlements, setSettlements] = useState<WorkerSettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Rate overrides & filters
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [editingRates, setEditingRates] = useState(false);
  const [includeInProgress, setIncludeInProgress] = useState(false);
  const [showGarmentDetails, setShowGarmentDetails] = useState(false);
  const [previousBalanceOverride, setPreviousBalanceOverride] = useState<
    number | null
  >(null);

  // DIALOGS
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [lastSettlement, setLastSettlement] =
    useState<WorkerSettlementRecord | null>(null);

  // LOAD ALLOCATIONS, ADVANCES, SETTLEMENTS
  const loadData = useCallback(async () => {
    if (!activeWorker) return;
    setLoading(true);
    try {
      // 1. Load allocations for this worker
      const allocData = await getWorkAllocations(activeWorker.id);
      setAllocations(allocData);

      // 2. Load advances for this worker within date range
      const advData = await fetchWorkerAdvances(
        activeWorker.id,
        cycleDetails.startDate,
        cycleDetails.endDate
      );
      setAdvances(advData);

      // 3. Load past settlement history
      const stmData = await fetchWorkerSettlements(activeWorker.id);
      setSettlements(stmData);

      // 4. Load custom rates
      const rates = getCustomWorkerRates(activeWorker.id);
      setCustomRates(rates);
    } catch (err) {
      console.error("Failed to load worker statement data:", err);
      toast.error("Could not load worker data");
    } finally {
      setLoading(false);
    }
  }, [activeWorker, cycleDetails.startDate, cycleDetails.endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine previous opening balance from latest settlement
  const autoOpeningBalance = useMemo(() => {
    if (!activeWorker) return 0;
    return getLatestClosingBalance(activeWorker.id, settlements);
  }, [activeWorker, settlements]);

  const effectivePreviousBalance =
    previousBalanceOverride !== null
      ? previousBalanceOverride
      : autoOpeningBalance;

  // COMPUTE FULL STATEMENT DATA
  const statementData: WorkerStatementData | null = useMemo(() => {
    if (!activeWorker) return null;
    return computeWorkerStatement({
      worker: activeWorker,
      allAllocations: allocations,
      advances,
      startDate: cycleDetails.startDate,
      endDate: cycleDetails.endDate,
      settlementDate: cycleDetails.settlementDate,
      cyclePreset,
      cycleLabel: cycleDetails.label,
      previousBalanceOverride: effectivePreviousBalance,
      customRates,
      includeInProgress,
    });
  }, [
    activeWorker,
    allocations,
    advances,
    cycleDetails,
    cyclePreset,
    effectivePreviousBalance,
    customRates,
    includeInProgress,
  ]);

  // DELETE ADVANCE
  const handleDeleteAdvance = async (advance: WorkerAdvance) => {
    if (
      !window.confirm(
        `Remove advance entry of ₹${Number(advance.amount).toLocaleString(
          "en-IN"
        )} (${format(new Date(advance.advanceDate), "dd MMM")})?`
      )
    )
      return;
    try {
      await removeWorkerAdvance(advance.id);
      setAdvances((prev) => prev.filter((a) => a.id !== advance.id));
      toast.success("Advance entry removed");
    } catch {
      toast.error("Could not remove advance");
    }
  };

  // UPDATE CUSTOM RATE
  const handleRateChange = (serviceName: string, rate: number) => {
    if (!activeWorker) return;
    const next = { ...customRates, [serviceName]: Math.max(0, rate) };
    setCustomRates(next);
    saveCustomWorkerRates(activeWorker.id, next);
  };

  // MONTH NAVIGATION
  const handlePrevMonth = () => {
    setReferenceDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setReferenceDate((prev) => addMonths(prev, 1));
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BAR: WORKER SELECTOR & CYCLE SELECTOR */}
      {/* 1. TOP CONTROLS BAR: WORKER SELECTOR + MONTH SELECTOR + ACTION BUTTONS */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 md:p-5 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* WORKER SELECTOR DROPDOWN */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto min-w-[260px] sm:min-w-[280px]">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <UsersRound className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Select Tailor / Worker (कारीगर चुनें)
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(Number(e.target.value));
                  setPreviousBalanceOverride(null);
                }}
                className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-background border border-border text-xs sm:text-sm font-extrabold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} &bull; {w.workerSpecialty || "Tailor"} ({w.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MONTH STEPPER */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-muted/40 p-1 sm:p-1.5 rounded-xl border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-lg"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-2 text-center min-w-[120px]">
              <span className="text-xs font-black text-foreground block">
                {format(referenceDate, "MMMM yyyy")}
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                Payment settlement cycle
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-lg"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* QUICK ACTION BUTTONS (Clean 3-col on phone, flex on tablet/desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvanceDialogOpen(true)}
              className="gap-1 sm:gap-1.5 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer h-9 px-2 sm:px-3 justify-center"
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+ Kharcha</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setSettlementModalOpen(true)}
              className="gap-1 sm:gap-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer h-9 px-2 sm:px-3 justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Settle</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPrintDialogOpen(true)}
              className="gap-1 sm:gap-1.5 rounded-xl text-xs font-bold cursor-pointer h-9 px-2 sm:px-3 justify-center"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Slip</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={loadData}
              disabled={loading}
              className="hidden sm:inline-flex h-9 w-9 rounded-xl text-muted-foreground shrink-0"
              title="Refresh statement"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* 10-DAY CYCLE SELECTOR BUTTONS (Scrollable pills on mobile) */}
        <div className="pt-2 border-t border-border flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Cycles:</span>
          </span>

          <button
            type="button"
            onClick={() => setCyclePreset("CYCLE_1")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              cyclePreset === "CYCLE_1"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Cycle 1 (1–10)</span>
            <span className="hidden sm:inline">Cycle 1 (1st – 10th)</span>
            <span className="ml-1 opacity-70 text-[10px] font-normal hidden sm:inline">
              [Pay 11th/12th]
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCyclePreset("CYCLE_2")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              cyclePreset === "CYCLE_2"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Cycle 2 (11–20)</span>
            <span className="hidden sm:inline">Cycle 2 (11th – 20th)</span>
            <span className="ml-1 opacity-70 text-[10px] font-normal hidden sm:inline">
              [Pay 21st/22nd]
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCyclePreset("CYCLE_3")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              cyclePreset === "CYCLE_3"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Cycle 3 (21–End)</span>
            <span className="hidden sm:inline">Cycle 3 (21st – End)</span>
            <span className="ml-1 opacity-70 text-[10px] font-normal hidden sm:inline">
              [Pay 1st/2nd]
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCyclePreset("FULL_MONTH")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              cyclePreset === "FULL_MONTH"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Full Month
          </button>

          <button
            type="button"
            onClick={() => setCyclePreset("CUSTOM")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              cyclePreset === "CUSTOM"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Custom Range
          </button>

          {cyclePreset === "CUSTOM" && (
            <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 rounded-lg text-xs w-32 sm:w-36"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 rounded-lg text-xs w-32 sm:w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      {statementData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {/* 1. TOTAL GARMENTS */}
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold">
                Garments Stitched
              </p>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Scissors className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {statementData.totalGarmentsCount}
                <span className="text-xs font-bold text-muted-foreground ml-1">
                  Pcs
                </span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                {statementData.garmentsSummary.length} garment types
              </p>
            </div>
          </div>

          {/* 2. GROSS WORK EARNINGS */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Gross Work Done
              </p>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 truncate">
                +₹{statementData.grossEarnings.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5 truncate">
                Total piece earnings
              </p>
            </div>
          </div>

          {/* 3. ADVANCES / DAILY KHARCHA */}
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-300 font-semibold">
                Advances / Kharcha
              </p>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 truncate">
                -₹{statementData.totalAdvances.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] sm:text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5 truncate">
                {statementData.advancesList.length} cash/UPI entries
              </p>
            </div>
          </div>

          {/* 4. PREVIOUS BALANCE */}
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-indigo-800 dark:text-indigo-300 font-semibold">
                Previous Balance
              </p>
              <button
                type="button"
                onClick={() => {
                  const val = prompt(
                    "Set previous balance (opening balance) for worker:",
                    String(effectivePreviousBalance)
                  );
                  if (val !== null && !isNaN(Number(val))) {
                    setPreviousBalanceOverride(Number(val));
                    toast.success(`Opening balance set to ₹${val}`);
                  }
                }}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                Edit
              </button>
            </div>
            <div className="mt-2">
              <p
                className={`text-xl sm:text-2xl font-black truncate ${
                  effectivePreviousBalance >= 0
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {effectivePreviousBalance >= 0 ? "+" : ""}₹
                {effectivePreviousBalance.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] sm:text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-0.5 truncate">
                From previous cycle
              </p>
            </div>
          </div>

          {/* 5. NET PAYABLE (BIG HIGHLIGHT CARD) */}
          <div
            className={`col-span-2 md:col-span-1 rounded-2xl border p-3 sm:p-4 shadow-sm flex flex-col justify-between ${
              statementData.netPayable > 0
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100"
                : statementData.netPayable < 0
                ? "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-100"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider">
                Net Payable (देय हिसाब)
              </p>
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="mt-2">
              <p
                className={`text-2xl font-black truncate ${
                  statementData.netPayable > 0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : statementData.netPayable < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground"
                }`}
              >
                ₹{statementData.netPayable.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate">
                {statementData.netPayable > 0
                  ? "Payable to worker (कारीगर को देय)"
                  : statementData.netPayable < 0
                  ? "Excess advance (कारीगर पर बकाया)"
                  : "Fully Balanced (हिसाब बराबर)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN SECTION: 2-COLUMN LAYOUT (GARMENTS SUMMARY & ADVANCES LOG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* COLUMN 1: GARMENTS MADE SUMMARY (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                    Garments Made by Worker (कारीगर द्वारा सिले कपड़े)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Count and piece earnings in this period
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRates(!editingRates)}
                  className="rounded-xl text-xs gap-1 h-7 sm:h-8"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {editingRates ? "Done Rates" : "Adjust Rates"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncludeInProgress(!includeInProgress)}
                  className={`rounded-xl text-xs gap-1 h-7 sm:h-8 ${
                    includeInProgress
                      ? "bg-primary/10 text-primary border-primary/30"
                      : ""
                  }`}
                >
                  {includeInProgress ? "✓ In-Progress" : "+ In-Progress"}
                </Button>
              </div>
            </div>

            {/* GARMENT TYPE GROUP TABLE & MOBILE CARDS */}
            {statementData && statementData.garmentsSummary.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                <Scissors className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  No completed garments in this cycle
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When garments allocated to {activeWorker?.name} are marked{" "}
                  <strong>Ready for Delivery</strong>, they will automatically appear
                  here grouped by service type.
                </p>
              </div>
            ) : (
              <>
                {/* 1. MOBILE CARDS VIEW (< sm) */}
                <div className="sm:hidden space-y-2.5">
                  {statementData?.garmentsSummary.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border bg-background space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-foreground text-sm">
                            {item.serviceName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.count} pieces stitched
                          </p>
                        </div>
                        <span className="font-black text-foreground text-sm">
                          ₹{item.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                          {item.count} Pcs
                        </span>
                        <div className="flex items-center gap-2">
                          {editingRates ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-muted-foreground">Rate ₹</span>
                              <Input
                                type="number"
                                value={item.rate}
                                onChange={(e) =>
                                  handleRateChange(
                                    item.serviceName,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 h-6 text-xs text-right font-bold rounded-md"
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">@ ₹{item.rate}/pc</span>
                          )}
                          {item.addOnsAmount > 0 && (
                            <span className="text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              +₹{item.addOnsAmount} add-ons
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Total Row */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase">
                        Total Gross Earnings
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {statementData?.totalGarmentsCount} Pcs
                      </p>
                    </div>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₹{statementData?.grossEarnings.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* 2. TABLE VIEW FOR TABLET & DESKTOP (>= sm) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold">
                        <th className="py-2.5 px-3 text-left">Garment Item / Service</th>
                        <th className="py-2.5 px-3 text-center">Completed (Pcs)</th>
                        <th className="py-2.5 px-3 text-right">Base Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Add-ons (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {statementData?.garmentsSummary.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <p className="font-extrabold text-foreground text-sm">
                              {item.serviceName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.count} pieces stitched
                            </p>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm border border-emerald-500/20">
                              {item.count} Pcs
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {editingRates ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  value={item.rate}
                                  onChange={(e) =>
                                    handleRateChange(
                                      item.serviceName,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-20 h-7 text-xs text-right font-bold rounded-lg"
                                />
                              </div>
                            ) : (
                              <span className="font-bold text-foreground text-sm">
                                ₹{item.rate.toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {item.addOnsAmount > 0 ? (
                              <span className="inline-flex items-center font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                +₹{item.addOnsAmount.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-black text-foreground text-sm">
                            ₹{item.totalAmount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-extrabold text-foreground bg-muted/20">
                        <td className="py-3 px-3 uppercase text-xs">
                          Total Gross Earnings
                        </td>
                        <td className="py-3 px-3 text-center text-sm text-emerald-600 dark:text-emerald-400">
                          {statementData?.totalGarmentsCount} Pcs
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                          ₹{statementData?.baseGarmentsEarnings.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-amber-600 dark:text-amber-400">
                          +₹{statementData?.totalAddOnsCommission.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right text-base text-emerald-600 dark:text-emerald-400">
                          ₹{statementData?.grossEarnings.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}

            {/* ADD-ON COMMISSIONS SUMMARY BREAKDOWN */}
            {statementData && statementData.addOnsSummary.length > 0 && (
              <div className="p-3.5 bg-amber-500/5 dark:bg-amber-950/20 rounded-xl border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <span>✨</span> Add-on Work Commission Breakdown (ऐड-ऑन अतिरिक्त काम)
                  </p>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                    Total Add-ons: +₹{statementData.totalAddOnsCommission.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {statementData.addOnsSummary.map((ao, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-background/90 rounded-lg border border-border text-xs flex justify-between items-center"
                    >
                      <div className="min-w-0 pr-1">
                        <p className="font-bold text-foreground truncate">{ao.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ao.count} pcs @ ₹{ao.rate}/pc
                        </p>
                      </div>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                        +₹{ao.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPANDABLE LOG OF INDIVIDUAL GARMENTS */}
            {statementData && statementData.allGarments.length > 0 && (
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGarmentDetails(!showGarmentDetails)}
                  className="w-full justify-between text-xs font-bold text-muted-foreground hover:text-foreground h-9 rounded-xl"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>View Garments ({statementData.allGarments.length})</span>
                  </span>
                  {showGarmentDetails ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )}
                </Button>

                {showGarmentDetails && (
                  <div className="mt-3 overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-border">
                    <table className="w-full text-[11px] min-w-[540px]">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs">
                        <tr className="border-b border-border text-left font-bold text-muted-foreground">
                          <th className="py-2 px-2.5">Garment #</th>
                          <th className="py-2 px-2.5">Order #</th>
                          <th className="py-2 px-2.5">Customer</th>
                          <th className="py-2 px-2.5">Service</th>
                          <th className="py-2 px-2.5">Due Date</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {statementData.allGarments.map((g) => (
                          <tr key={g.garmentId} className="hover:bg-muted/30">
                            <td className="py-1.5 px-2.5 font-mono font-bold text-primary">
                              #{g.garmentId}
                            </td>
                            <td className="py-1.5 px-2.5 font-semibold">
                              Order #{g.orderId}
                              {g.sampleBookPageNumber && (
                                <span className="text-muted-foreground ml-1">
                                  (Pg: {g.sampleBookPageNumber})
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 font-medium">
                              {g.customerName}
                            </td>
                            <td className="py-1.5 px-2.5 font-semibold">
                              <div>{g.serviceName}</div>
                              {g.addOns && g.addOns.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {g.addOns.map((ao) => (
                                    <span
                                      key={ao.id}
                                      className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-1 py-0.2 rounded font-medium"
                                    >
                                      {ao.name} (x{ao.quantity})
                                      {Number(ao.tailorCommission ?? 0) > 0
                                        ? ` +₹${
                                            Number(ao.tailorCommission) *
                                            Number(ao.quantity)
                                          }`
                                        : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-muted-foreground">
                              {g.dueDate
                                ? format(new Date(g.dueDate), "dd MMM yyyy")
                                : "—"}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  garmentStatusColor[g.status as GarmentStatus] ??
                                  "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {garmentStatusLabel[g.status as GarmentStatus] ||
                                  g.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: ADVANCES & DAILY KHARCHA LOG (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Advances & Daily Kharcha
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    दैनिक खर्चा व अग्रिम विवरण
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setAdvanceDialogOpen(true)}
                className="gap-1 rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>

            {/* ADVANCES LIST */}
            {advances.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                <Wallet className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  No advances taken in this cycle
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Record daily cash, tea/food expenses, or lump-sum advances given
                  to {activeWorker?.name}.
                </p>
                <Button
                  size="sm"
                  onClick={() => setAdvanceDialogOpen(true)}
                  className="rounded-xl mt-2 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Record Kharcha Now
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {advances.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        ₹
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-foreground">
                            {adv.type === "DAILY_KHARCHA"
                              ? "दैनिक खर्चा"
                              : adv.type === "ADVANCE"
                              ? "एडवांस / पेशगी"
                              : adv.type}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-mono font-bold"
                          >
                            {adv.paymentMode}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {format(new Date(adv.advanceDate), "dd MMM yyyy")}
                          {adv.note && <span> &bull; {adv.note}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                        -₹{Number(adv.amount).toLocaleString("en-IN")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAdvance(adv)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                        title="Delete advance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ADVANCES FOOTER TOTAL */}
            {advances.length > 0 && (
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground uppercase">
                  Total Deductions (कुल काटा गया)
                </span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                  -₹{statementData?.totalAdvances.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* PAST SETTLEMENT HISTORY COMPONENT */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-extrabold text-foreground">
                  Past Settlements History (पुराने हिसाब का रिकॉर्ड)
                </h4>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">
                {settlements.length}
              </Badge>
            </div>

            {settlements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">
                No finalized settlements recorded yet for this worker.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {settlements.map((stm) => (
                  <div
                    key={stm.id}
                    className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-foreground">
                        {stm.cycleLabel || "Settlement"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Paid:{" "}
                        <strong className="text-emerald-600">
                          ₹{Number(stm.amountPaid).toLocaleString("en-IN")}
                        </strong>{" "}
                        &bull; {format(new Date(stm.settlementDate), "dd MMM yyyy")}
                      </p>
                      {stm.closingBalance !== 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Carry forward: ₹
                          {Number(stm.closingBalance).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLastSettlement(stm);
                        setPrintDialogOpen(true);
                      }}
                      className="rounded-lg h-7 text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      Reprint
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD ADVANCE / KHARCHA */}
      <WorkerAdvanceDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
        workers={workers}
        selectedWorkerId={selectedWorkerId}
        onAdvanceAdded={loadData}
      />

      {/* MODAL 2: SETTLE HISAB */}
      <WorkerSettlementModal
        open={settlementModalOpen}
        onOpenChange={setSettlementModalOpen}
        statementData={statementData}
        onSettled={(record) => {
          setLastSettlement(record);
          loadData();
          setPrintDialogOpen(true);
        }}
      />

      {/* MODAL 3: PRINT RECEIPT / INVOICE */}
      <WorkerStatementPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        statementData={statementData}
        amountPaid={
          lastSettlement ? Number(lastSettlement.amountPaid) : undefined
        }
        paymentMode={lastSettlement?.paymentMode || "CASH"}
        settlementNote={lastSettlement?.note}
        settlementNumber={lastSettlement?.settlementNumber}
      />
    </div>
  );
}
