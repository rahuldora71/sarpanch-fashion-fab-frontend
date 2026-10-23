import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";
import {
  BarChart3,
  Calendar,
  Layers,
  Scissors,
  UsersRound,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Printer,
  RefreshCw,
  ExternalLink,
  Download,
  Search,
  Wallet,
  Receipt,
  Sparkles,
  ChevronRight,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

// Services
import { orderService } from "@/services/orderService";
import { getWorkAllocations, getAllWorkers } from "@/services/workerService";
import { getPaymentAnalytics, getPaymentTransactions } from "@/services/paymentService";
import { getExpenses } from "@/services/expenseService";
import {
  getMonthlyBillingReport,
  getCaExportReport,
} from "@/services/billingModuleService";

// Types
import type { OrderResponse } from "@/types/order";
import type { WorkAllocationItem, Worker } from "@/types/worker";
import type { PaymentTransaction, PaymentAnalytics } from "@/types/payment";
import type { ExpenseSummaryResponse } from "@/types/expense";
import type { MonthlyReport, CaExport } from "@/types/billingModule";
import { garmentStatusColor, garmentStatusLabel } from "@/utils/productionUtils";
import type { GarmentStatus } from "@/types/order";

type DatePreset =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "LAST_30"
  | "THIS_YEAR"
  | "CUSTOM";

type ReportTab =
  | "OVERVIEW"
  | "TIMELINE"
  | "WORKERS"
  | "SERVICES"
  | "FINANCIAL"
  | "AUDIT_LOG"
  | "CA_REPORTS";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const tabParam = (searchParams.get("tab")?.toUpperCase() as ReportTab) || "OVERVIEW";
  const [activeTab, setActiveTab] = useState<ReportTab>(
    ["OVERVIEW", "TIMELINE", "WORKERS", "SERVICES", "FINANCIAL", "AUDIT_LOG", "CA_REPORTS"].includes(tabParam)
      ? tabParam
      : "OVERVIEW"
  );

  // Date Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw Datasets
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [garments, setGarments] = useState<WorkAllocationItem[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseSummaryResponse | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);

  // CA & Monthly Tax Sub-state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [monthlyTaxReport, setMonthlyTaxReport] = useState<MonthlyReport | null>(null);
  const [caExportData, setCaExportData] = useState<CaExport | null>(null);
  const [loadingCa, setLoadingCa] = useState(false);

  // Search in Audit Log
  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("ALL");

  // Load All Primary Work Data
  const loadReportsData = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        ordersRes,
        garmentsRes,
        paymentsRes,
        analyticsRes,
        expenseRes,
        workersRes,
      ] = await Promise.allSettled([
        orderService.getAllOrders({ page: 0, size: 2000, sort: "orderDate,desc" }),
        getWorkAllocations(),
        getPaymentTransactions({ size: 2000 }),
        getPaymentAnalytics(),
        getExpenses(),
        getAllWorkers(),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value?.content) {
        setOrders(ordersRes.value.content);
      }
      if (garmentsRes.status === "fulfilled") {
        setGarments(garmentsRes.value);
      }
      if (paymentsRes.status === "fulfilled" && paymentsRes.value?.content) {
        setPayments(paymentsRes.value.content);
      }
      if (analyticsRes.status === "fulfilled") {
        setPaymentAnalytics(analyticsRes.value);
      }
      if (expenseRes.status === "fulfilled") {
        setExpenseData(expenseRes.value);
      }
      if (workersRes.status === "fulfilled") {
        setWorkers(workersRes.value);
      }

    } catch (err) {
      console.error("Failed to load reports data:", err);
      toast.error("Could not load reports data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // Handle Preset Selection
  const handlePresetSelect = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === "TODAY") {
      const str = format(today, "yyyy-MM-dd");
      setStartDate(str);
      setEndDate(str);
    } else if (preset === "YESTERDAY") {
      const yest = format(subDays(today, 1), "yyyy-MM-dd");
      setStartDate(yest);
      setEndDate(yest);
    } else if (preset === "THIS_WEEK") {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (preset === "THIS_MONTH") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
    } else if (preset === "LAST_MONTH") {
      const lastMonthDate = subDays(startOfMonth(today), 1);
      setStartDate(format(startOfMonth(lastMonthDate), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(lastMonthDate), "yyyy-MM-dd"));
    } else if (preset === "LAST_30") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "THIS_YEAR") {
      setStartDate(format(startOfYear(today), "yyyy-MM-dd"));
      setEndDate(format(endOfYear(today), "yyyy-MM-dd"));
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Helper function to check if an item date matches the current filter
  const isInDateRange = useCallback(
    (dateStr?: string | null) => {
      if (!startDate && !endDate) return true;
      if (!dateStr) return false;
      const cleanDate = dateStr.substring(0, 10);
      if (startDate && cleanDate < startDate) return false;
      if (endDate && cleanDate > endDate) return false;
      return true;
    },
    [startDate, endDate]
  );

  // ============================================================
  // FILTERED DATASETS BASED ON DATE RANGE
  // ============================================================
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => isInDateRange(o.orderDate || o.createdAt));
  }, [orders, isInDateRange]);

  const filteredGarments = useMemo(() => {
    return garments.filter((g) =>
      isInDateRange(g.orderDate || (g.createdAt ? g.createdAt.substring(0, 10) : ""))
    );
  }, [garments, isInDateRange]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => isInDateRange(p.paidAt || p.createdAt));
  }, [payments, isInDateRange]);

  const filteredExpenses = useMemo(() => {
    if (!expenseData?.expenses) return [];
    return expenseData.expenses.filter((e) => isInDateRange(e.expenseDate));
  }, [expenseData, isInDateRange]);

  // ============================================================
  // AGGREGATE CORE STATISTICS ("ALL THE STATISTICS OF MY WHOLE WORK")
  // ============================================================
  const stats = useMemo(() => {
    // 1. Orders & Garments Count
    const totalOrders = filteredOrders.length;
    const totalGarments = filteredGarments.length;

    // 2. Production Stage Breakdown
    let fabricCutCount = 0;
    let cuttingCount = 0;
    let stitchingCount = 0;
    let readyCount = 0;
    let deliveredCount = 0;
    let alterationCount = 0;

    for (const g of filteredGarments) {
      if (g.status === "DELIVERED") deliveredCount++;
      else if (g.status === "READY") readyCount++;
      else if (g.status === "STITCHING" || g.status === "IRONING") stitchingCount++;
      else if (g.status === "CUTTING") cuttingCount++;
      else if (g.status === "ALTERATION") alterationCount++;
      else fabricCutCount++;
    }

    const completedGarments = readyCount + deliveredCount;
    const inProgressGarments = cuttingCount + stitchingCount + fabricCutCount;
    const completionRate =
      totalGarments > 0 ? Math.round((completedGarments / totalGarments) * 100) : 0;

    // 3. Financials
    const totalGarmentValue = filteredGarments.reduce(
      (sum, g) => sum + (Number(g.garmentPrice) || 0),
      0
    );
    const totalTailorCommission = filteredGarments.reduce(
      (sum, g) => sum + (Number(g.tailorCommission) || 0),
      0
    );
    const totalPaymentsReceived = filteredPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // Approximate Net Workshop Margin:
    // Collections Received - Tailor Labor Commission - Workshop Expenses
    const netCashMargin = Math.round(
      totalPaymentsReceived - totalTailorCommission - totalExpenses
    );

    // Customer Pending / Outstanding Balance (from payment analytics or delivered unpaid)
    const pendingBalance = paymentAnalytics?.deliveredUnpaidTotalBalance ?? 0;

    // Average Order Value
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalGarmentValue / totalOrders) : 0;

    return {
      totalOrders,
      totalGarments,
      fabricCutCount,
      cuttingCount,
      stitchingCount,
      readyCount,
      deliveredCount,
      alterationCount,
      completedGarments,
      inProgressGarments,
      completionRate,
      totalGarmentValue: Math.round(totalGarmentValue),
      totalTailorCommission: Math.round(totalTailorCommission),
      totalPaymentsReceived: Math.round(totalPaymentsReceived),
      totalExpenses: Math.round(totalExpenses),
      netCashMargin,
      pendingBalance: Math.round(pendingBalance),
      averageOrderValue,
    };
  }, [
    filteredOrders,
    filteredGarments,
    filteredPayments,
    filteredExpenses,
    paymentAnalytics,
  ]);

  // ============================================================
  // DATE-WISE WORK TIMELINE ("THE DATE OF MY WHOLE WORK")
  // ============================================================
  const dateTimeline = useMemo(() => {
    interface DaySummary {
      date: string;
      orderCount: number;
      garmentsCutCount: number;
      garmentsStitchedCount: number;
      garmentsDeliveredCount: number;
      totalGarments: number;
      paymentsCollected: number;
      tailorCommission: number;
      expensesIncurred: number;
      netDailyFlow: number;
      garments: WorkAllocationItem[];
    }

    const map = new Map<string, DaySummary>();

    const getOrCreate = (d: string): DaySummary => {
      const clean = d.substring(0, 10);
      if (!map.has(clean)) {
        map.set(clean, {
          date: clean,
          orderCount: 0,
          garmentsCutCount: 0,
          garmentsStitchedCount: 0,
          garmentsDeliveredCount: 0,
          totalGarments: 0,
          paymentsCollected: 0,
          tailorCommission: 0,
          expensesIncurred: 0,
          netDailyFlow: 0,
          garments: [],
        });
      }
      return map.get(clean)!;
    };

    // Aggregate Orders by Date
    for (const o of filteredOrders) {
      const d = o.orderDate || o.createdAt;
      if (d) {
        getOrCreate(d).orderCount += 1;
      }
    }

    // Aggregate Garments & Commissions by Date
    for (const g of filteredGarments) {
      const d = g.orderDate || (g.createdAt ? g.createdAt.substring(0, 10) : "");
      if (d) {
        const item = getOrCreate(d);
        item.totalGarments += 1;
        item.tailorCommission += Number(g.tailorCommission) || 0;
        item.garments.push(g);

        if (g.status === "DELIVERED") item.garmentsDeliveredCount += 1;
        else if (g.status === "READY") item.garmentsStitchedCount += 1;
        else if (g.status === "CUTTING" || g.cuttingByWorkerId) item.garmentsCutCount += 1;
      }
    }

    // Aggregate Payments by Date
    for (const p of filteredPayments) {
      const d = p.paidAt || p.createdAt;
      if (d) {
        getOrCreate(d).paymentsCollected += Number(p.amount) || 0;
      }
    }

    // Aggregate Expenses by Date
    for (const e of filteredExpenses) {
      if (e.expenseDate) {
        getOrCreate(e.expenseDate).expensesIncurred += Number(e.amount) || 0;
      }
    }

    // Compute Net Daily Flow and sort descending by date
    const list = Array.from(map.values()).map((row) => ({
      ...row,
      paymentsCollected: Math.round(row.paymentsCollected),
      tailorCommission: Math.round(row.tailorCommission),
      expensesIncurred: Math.round(row.expensesIncurred),
      netDailyFlow: Math.round(
        row.paymentsCollected - row.tailorCommission - row.expensesIncurred
      ),
    }));

    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [filteredOrders, filteredGarments, filteredPayments, filteredExpenses]);

  // ============================================================
  // WORKER ATTRIBUTION & TAILOR PERFORMANCE LEADERBOARD
  // ============================================================
  const workerLeaderboard = useMemo(() => {
    interface WorkerRow {
      workerId: number;
      name: string;
      specialty: string;
      phone?: string | null;
      piecesCut: number;
      piecesStitched: number;
      piecesReady: number;
      piecesDelivered: number;
      totalCommission: number;
      activeLoad: number;
    }

    const map = new Map<number, WorkerRow>();

    // Seed from workers master
    for (const w of workers) {
      map.set(w.id, {
        workerId: w.id,
        name: w.name,
        specialty: String(w.workerSpecialty || "Tailor"),
        phone: w.phone,
        piecesCut: 0,
        piecesStitched: 0,
        piecesReady: 0,
        piecesDelivered: 0,
        totalCommission: 0,
        activeLoad: 0,
      });
    }

    // Attribute from filtered garments
    for (const g of filteredGarments) {
      // Made by tailor
      if (g.madeByWorkerId) {
        if (!map.has(g.madeByWorkerId)) {
          map.set(g.madeByWorkerId, {
            workerId: g.madeByWorkerId,
            name: g.madeByWorkerName || `Worker #${g.madeByWorkerId}`,
            specialty: g.madeByWorkerSpecialty || "Tailor",
            phone: g.madeByWorkerPhone,
            piecesCut: 0,
            piecesStitched: 0,
            piecesReady: 0,
            piecesDelivered: 0,
            totalCommission: 0,
            activeLoad: 0,
          });
        }

        const row = map.get(g.madeByWorkerId)!;
        row.piecesStitched += 1;
        row.totalCommission += Number(g.tailorCommission) || 0;

        if (g.status === "READY") row.piecesReady += 1;
        else if (g.status === "DELIVERED") row.piecesDelivered += 1;
        else row.activeLoad += 1;
      }

      // Cut by cutting master
      if (g.cuttingByWorkerId) {
        if (map.has(g.cuttingByWorkerId)) {
          map.get(g.cuttingByWorkerId)!.piecesCut += 1;
        }
      }
    }

    return Array.from(map.values())
      .map((w) => ({ ...w, totalCommission: Math.round(w.totalCommission) }))
      .sort((a, b) => b.piecesStitched - a.piecesStitched || b.piecesCut - a.piecesCut);
  }, [workers, filteredGarments]);

  // ============================================================
  // SERVICE & GARMENT CATEGORY BREAKDOWN
  // ============================================================
  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalRevenue: number; totalCommission: number }>();

    for (const g of filteredGarments) {
      const name = g.serviceName || "Other Garment";
      const curr = map.get(name) || { count: 0, totalRevenue: 0, totalCommission: 0 };
      curr.count += 1;
      curr.totalRevenue += Number(g.garmentPrice) || 0;
      curr.totalCommission += Number(g.tailorCommission) || 0;
      map.set(name, curr);
    }

    const totalGarments = filteredGarments.length;

    return Array.from(map.entries())
      .map(([serviceName, data]) => ({
        serviceName,
        count: data.count,
        totalRevenue: Math.round(data.totalRevenue),
        totalCommission: Math.round(data.totalCommission),
        avgPrice: data.count > 0 ? Math.round(data.totalRevenue / data.count) : 0,
        percentage: totalGarments > 0 ? Math.round((data.count / totalGarments) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredGarments]);

  // ============================================================
  // PAYMENT METHOD DISTRIBUTION
  // ============================================================
  const paymentMethodsDistribution = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    for (const p of filteredPayments) {
      const method = String(p.paymentMethod || "CASH").toUpperCase();
      const curr = map.get(method) || { count: 0, total: 0 };
      curr.count += 1;
      curr.total += Number(p.amount) || 0;
      map.set(method, curr);
    }

    const grandTotal = Array.from(map.values()).reduce((sum, item) => sum + item.total, 0);

    return Array.from(map.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: Math.round(data.total),
      percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
    }));
  }, [filteredPayments]);

  // ============================================================
  // AUDIT LOG FILTERED LIST
  // ============================================================
  const auditLogItems = useMemo(() => {
    return filteredGarments.filter((item) => {
      if (auditStatusFilter !== "ALL" && item.status !== auditStatusFilter) {
        return false;
      }

      if (auditSearch.trim()) {
        const q = auditSearch.trim().toLowerCase();
        const matchesOrder = item.orderId.toString().includes(q);
        const matchesGarment = item.garmentId.toString().includes(q);
        const matchesCustomer = item.customerName.toLowerCase().includes(q);
        const matchesService = item.serviceName.toLowerCase().includes(q);
        const matchesWorker = item.madeByWorkerName
          ? item.madeByWorkerName.toLowerCase().includes(q)
          : false;
        const matchesCutter = item.cuttingByWorkerName
          ? item.cuttingByWorkerName.toLowerCase().includes(q)
          : false;

        if (
          !matchesOrder &&
          !matchesGarment &&
          !matchesCustomer &&
          !matchesService &&
          !matchesWorker &&
          !matchesCutter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [filteredGarments, auditStatusFilter, auditSearch]);

  // Fetch CA & Monthly Tax Report when CA_REPORTS tab is opened
  const fetchMonthlyAndCa = useCallback(async () => {
    try {
      setLoadingCa(true);
      const [monthlyRes, caRes] = await Promise.allSettled([
        getMonthlyBillingReport(selectedMonth, selectedYear),
        getCaExportReport(
          startDate || format(startOfMonth(new Date()), "yyyy-MM-dd"),
          endDate || format(new Date(), "yyyy-MM-dd")
        ),
      ]);

      if (monthlyRes.status === "fulfilled") {
        setMonthlyTaxReport(monthlyRes.value);
      }
      if (caRes.status === "fulfilled") {
        setCaExportData(caRes.value);
      }
    } catch (err) {
      console.error("Failed to load CA reports:", err);
    } finally {
      setLoadingCa(false);
    }
  }, [selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    if (activeTab === "CA_REPORTS") {
      fetchMonthlyAndCa();
    }
  }, [activeTab, fetchMonthlyAndCa]);

  // One-click Print
  const handlePrintReport = () => {
    window.print();
  };

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    if (auditLogItems.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = [
      "Garment ID",
      "Order ID",
      "Order Date",
      "Customer Name",
      "Customer Phone",
      "Service Name",
      "Book Page",
      "Status",
      "Master Cutter",
      "Stitching Tailor",
      "Garment Price (₹)",
      "Tailor Commission (₹)",
      "Due Date",
    ];

    const rows = auditLogItems.map((g) => [
      g.garmentId,
      g.orderId,
      g.orderDate || "",
      `"${g.customerName.replace(/"/g, '""')}"`,
      `"${g.customerPhone || ""}"`,
      `"${g.serviceName.replace(/"/g, '""')}"`,
      `"${g.sampleBookPageNumber || ""}"`,
      g.status,
      `"${g.cuttingByWorkerName || ""}"`,
      `"${g.madeByWorkerName || ""}"`,
      g.garmentPrice || 0,
      g.tailorCommission || 0,
      g.dueDate || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sarpanch_whole_work_report_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Whole work report CSV exported!");
  };

  return (
    <div className="min-h-full bg-background text-foreground pb-16">
      {/* ============================================================
          TOP STICKY HEADER & CONTROLS
      ============================================================ */}
      <div className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-20 px-3 sm:px-4 md:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                  Reports & Work Statistics
                </h1>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/30">
                  Master Portal
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Comprehensive analytics, production metrics, revenue, worker hisab, and date-wise timeline of your whole work
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              className="gap-1.5 rounded-xl text-xs h-8 sm:h-9 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Report</span>
              <span className="sm:hidden">Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 rounded-xl text-xs h-8 sm:h-9 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadReportsData(true)}
              disabled={loading || refreshing}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 space-y-5">
        {/* ============================================================
            DATE FILTER PRESETS & RANGE TOOLBAR
        ============================================================ */}
        <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground">Date Range of Whole Work:</span>
            </div>

            {/* Presets Horizontal Scroll */}
            <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 -mx-1 px-1 lg:mx-0 lg:px-0">
              {(
                [
                  { id: "ALL", label: "🌟 All Time (Whole Work)" },
                  { id: "TODAY", label: "Today" },
                  { id: "YESTERDAY", label: "Yesterday" },
                  { id: "THIS_WEEK", label: "This Week" },
                  { id: "THIS_MONTH", label: "This Month" },
                  { id: "LAST_MONTH", label: "Last Month" },
                  { id: "LAST_30", label: "Last 30 Days" },
                  { id: "THIS_YEAR", label: "This Year" },
                  { id: "CUSTOM", label: "Custom Range" },
                ] as { id: DatePreset; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    datePreset === p.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs if CUSTOM or specified */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground font-medium text-[11px]">Interval:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
              />
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetSelect("ALL")}
                  className="rounded-xl text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  Reset to All Time
                </Button>
              )}
            </div>

            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>
                {startDate && endDate
                  ? `Showing records from ${startDate} to ${endDate}`
                  : "Showing whole work lifetime records"}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            TOP LEVEL REPORT TABS
        ============================================================ */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 border-b border-border pb-2.5 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[
            { id: "OVERVIEW", label: "📊 Overview Scorecard", icon: BarChart3 },
            { id: "TIMELINE", label: "📅 Date-Wise Work Timeline", icon: Calendar },
            { id: "WORKERS", label: "👷 Tailors & Output", icon: UsersRound },
            { id: "SERVICES", label: "✂️ Services & Garments", icon: Scissors },
            { id: "FINANCIAL", label: "💰 Financial & Cash Flow", icon: DollarSign },
            { id: "AUDIT_LOG", label: "📜 Whole Work Audit Register", icon: Receipt },
            { id: "CA_REPORTS", label: "🏛️ GST & CA Reports", icon: Building },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id as ReportTab);
                setSearchParams({ tab: t.id.toLowerCase() });
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ============================================================
            TAB 1: OVERVIEW SCORECARD
        ============================================================ */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-5">
            {/* 4 PRIMARY METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Orders Placed */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Orders Processed
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                    {stats.totalOrders}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Avg Value: ₹{stats.averageOrderValue.toLocaleString("en-IN")} / order
                  </p>
                </div>
              </div>

              {/* Total Garments Produced */}
              <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80">
                    Garments Produced
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
                    {stats.totalGarments}{" "}
                    <span className="text-xs font-semibold">pcs</span>
                  </p>
                  <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80 mt-0.5">
                    {stats.completedGarments} Ready/Delivered ({stats.completionRate}%)
                  </p>
                </div>
              </div>

              {/* Total Collections Received */}
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                    Payments Received
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                    ₹{stats.totalPaymentsReceived.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 mt-0.5">
                    Unpaid Due: ₹{stats.pendingBalance.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Estimated Net Workshop Cash Flow Margin */}
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 p-4 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80">
                    Net Workshop Margin
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p
                    className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                      stats.netCashMargin >= 0
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    ₹{stats.netCashMargin.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    After tailors (₹{stats.totalTailorCommission}) & expenses (₹{stats.totalExpenses})
                  </p>
                </div>
              </div>
            </div>

            {/* PRODUCTION PIPELINE VISUAL STATUS */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    Workshop Production Pipeline Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Where every piece of work currently stands in your shop
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  Total {stats.totalGarments} Garments
                </span>
              </div>

              {/* Stage Progress Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-xl border border-sky-500/25 bg-sky-500/5 dark:bg-sky-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    1. Fabric Cut
                  </p>
                  <p className="text-xl font-extrabold font-mono text-sky-700 dark:text-sky-300 mt-0.5">
                    {stats.fabricCutCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">In queue for cut</p>
                </div>

                <div className="p-3 rounded-xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    2. Cut by Master
                  </p>
                  <p className="text-xl font-extrabold font-mono text-purple-700 dark:text-purple-300 mt-0.5">
                    {stats.cuttingCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ready for tailor</p>
                </div>

                <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    3. In Stitching
                  </p>
                  <p className="text-xl font-extrabold font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                    {stats.stitchingCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">With tailors</p>
                </div>

                <div className="p-3 rounded-xl border border-teal-500/25 bg-teal-500/5 dark:bg-teal-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                    4. Ready Checked
                  </p>
                  <p className="text-xl font-extrabold font-mono text-teal-700 dark:text-teal-300 mt-0.5">
                    {stats.readyCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ready for pickup</p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    5. Delivered
                  </p>
                  <p className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {stats.deliveredCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">To customer</p>
                </div>

                <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    6. Alterations
                  </p>
                  <p className="text-xl font-extrabold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                    {stats.alterationCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Fixes / Adjustments</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                  {stats.deliveredCount > 0 && (
                    <div
                      style={{ width: `${(stats.deliveredCount / Math.max(stats.totalGarments, 1)) * 100}%` }}
                      className="bg-emerald-500 transition-all"
                      title={`Delivered: ${stats.deliveredCount}`}
                    />
                  )}
                  {stats.readyCount > 0 && (
                    <div
                      style={{ width: `${(stats.readyCount / Math.max(stats.totalGarments, 1)) * 100}%` }}
                      className="bg-teal-500 transition-all"
                      title={`Ready: ${stats.readyCount}`}
                    />
                  )}
                  {stats.stitchingCount > 0 && (
                    <div
                      style={{ width: `${(stats.stitchingCount / Math.max(stats.totalGarments, 1)) * 100}%` }}
                      className="bg-amber-500 transition-all"
                      title={`Stitching: ${stats.stitchingCount}`}
                    />
                  )}
                  {stats.cuttingCount > 0 && (
                    <div
                      style={{ width: `${(stats.cuttingCount / Math.max(stats.totalGarments, 1)) * 100}%` }}
                      className="bg-purple-500 transition-all"
                      title={`Cut: ${stats.cuttingCount}`}
                    />
                  )}
                  {stats.fabricCutCount > 0 && (
                    <div
                      style={{ width: `${(stats.fabricCutCount / Math.max(stats.totalGarments, 1)) * 100}%` }}
                      className="bg-sky-500 transition-all"
                      title={`Fabric Cut: ${stats.fabricCutCount}`}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>Work Done: {stats.completionRate}%</span>
                  <span>In Production: {100 - stats.completionRate}%</span>
                </div>
              </div>
            </div>

            {/* TWO COLUMNS: TOP SERVICES + QUICK DATE TIMELINE TEASER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Services Card */}
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Top Performing Services
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("SERVICES")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All Services
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {serviceBreakdown.slice(0, 5).map((s) => (
                    <div key={s.serviceName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{s.serviceName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{s.count} pcs ({s.percentage}%)</span>
                          <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                            ₹{s.totalRevenue.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          style={{ width: `${s.percentage}%` }}
                          className="h-full bg-primary rounded-full transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tailors Output Card */}
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <UsersRound className="w-4 h-4 text-primary" />
                    Top Contributing Tailors
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("WORKERS")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Worker Leaderboard
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {workerLeaderboard.slice(0, 4).map((w) => (
                    <div
                      key={w.workerId}
                      className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-foreground truncate">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {w.piecesStitched} stitched · {w.piecesReady + w.piecesDelivered} completed
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Commission</p>
                        <p className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{w.totalCommission.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: DATE-WISE WORK TIMELINE ("THE DATE OF MY WHOLE WORK")
        ============================================================ */}
        {activeTab === "TIMELINE" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-card to-muted/30 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Date-Wise Daily Work Activity Register
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  See exactly which day how many orders arrived, garments were cut, stitched, delivered, payments received, and net cash flow
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-bold font-mono">
                {dateTimeline.length} Active Days
              </Badge>
            </div>

            {dateTimeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-xs text-muted-foreground">
                No work activity recorded in the selected date range.
              </div>
            ) : (
              <div className="space-y-3">
                {dateTimeline.map((day) => (
                  <motion.div
                    key={day.date}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-xs space-y-3 hover:border-border/80 transition-all"
                  >
                    {/* Header Row: Date & KPI badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          📅
                        </span>
                        <div>
                          <p className="text-sm font-extrabold text-foreground">
                            {format(parseISO(day.date), "EEEE, d MMMM yyyy")}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Date: {day.date}
                          </p>
                        </div>
                      </div>

                      {/* Day Net Flow Pill */}
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-xl bg-muted/40 border border-border text-right text-xs">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1.5">
                            Daily Flow:
                          </span>
                          <span
                            className={`font-extrabold font-mono ${
                              day.netDailyFlow >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {day.netDailyFlow >= 0 ? "+" : ""}₹{day.netDailyFlow.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Work metrics grid for this date */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-muted/20 border border-border/60">
                        <span className="text-[10px] text-muted-foreground font-semibold">Orders Received</span>
                        <p className="text-base font-bold font-mono text-foreground mt-0.5">
                          {day.orderCount}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-muted/20 border border-border/60">
                        <span className="text-[10px] text-muted-foreground font-semibold">Garments in Work</span>
                        <p className="text-base font-bold font-mono text-foreground mt-0.5">
                          {day.totalGarments}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-muted/20 border border-border/60">
                        <span className="text-[10px] text-muted-foreground font-semibold">Delivered</span>
                        <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {day.garmentsDeliveredCount}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          Payments Received
                        </span>
                        <p className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                          ₹{day.paymentsCollected.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">
                          Tailor Commissions
                        </span>
                        <p className="text-base font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-0.5">
                          ₹{day.tailorCommission.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
                          Expenses Incurred
                        </span>
                        <p className="text-base font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                          ₹{day.expensesIncurred.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Garments preview on this date */}
                    {day.garments.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Garments Placed / Worked:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {day.garments.map((g) => (
                            <button
                              key={g.garmentId}
                              type="button"
                              onClick={() => navigate(`/orders/${g.orderId}`)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border bg-background hover:border-primary text-[11px] cursor-pointer transition-colors"
                            >
                              <span className="font-bold text-foreground">{g.serviceName}</span>
                              <span className="text-muted-foreground font-mono">#{g.orderId}</span>
                              <span
                                className={`text-[9px] px-1 rounded-sm font-semibold border ${
                                  garmentStatusColor[g.status as GarmentStatus] ?? ""
                                }`}
                              >
                                {garmentStatusLabel[g.status as GarmentStatus] || g.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: TAILORS & WORKERS PERFORMANCE
        ============================================================ */}
        {activeTab === "WORKERS" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-card to-muted/30 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <UsersRound className="w-5 h-5 text-primary" />
                  Worker Output & Commission Leaderboard
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Who cut what, who stitched what, pieces delivered, and commissions owed
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/workers?tab=statement")}
                className="rounded-xl text-xs gap-1.5 h-8"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Open Worker Hisab & Slips</span>
              </Button>
            </div>

            <div className="space-y-3">
              {workerLeaderboard.map((worker) => (
                <div
                  key={worker.workerId}
                  className="rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-sm border border-indigo-500/20">
                      {worker.name[0] || "W"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm sm:text-base text-foreground">
                          {worker.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {worker.specialty}
                        </Badge>
                        {worker.phone && (
                          <span className="text-[11px] text-muted-foreground">
                            📞 {worker.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Active In-Progress: <strong>{worker.activeLoad}</strong> pcs
                      </p>
                    </div>
                  </div>

                  {/* Output Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs lg:text-right">
                    <div className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Cut Pieces</p>
                      <p className="font-extrabold font-mono text-sm">{worker.piecesCut} pcs</p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Stitched</p>
                      <p className="font-extrabold font-mono text-sm">{worker.piecesStitched} pcs</p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                        Delivered
                      </p>
                      <p className="font-extrabold font-mono text-sm text-emerald-700 dark:text-emerald-300">
                        {worker.piecesDelivered} pcs
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                      <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
                        Commission
                      </p>
                      <p className="font-extrabold font-mono text-sm text-indigo-700 dark:text-indigo-300">
                        ₹{worker.totalCommission.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: SERVICES & GARMENT TYPES
        ============================================================ */}
        {activeTab === "SERVICES" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-card to-muted/30 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Service Types Volume & Revenue Analysis
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed distribution of garments tailored (Kurta, Pajama, Safari, 2-Piece Suit, Shirt, Pant, etc.)
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-bold font-mono">
                {serviceBreakdown.length} Services Tailored
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {serviceBreakdown.map((item) => (
                <div
                  key={item.serviceName}
                  className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground">{item.serviceName}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {item.percentage}% of shop work
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-muted/20 border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold">Total Made</span>
                      <p className="text-base font-extrabold font-mono mt-0.5">{item.count} pcs</p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/20 border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold">Avg Rate</span>
                      <p className="text-base font-extrabold font-mono mt-0.5">₹{item.avgPrice}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-2">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                        Gross Billed Revenue
                      </span>
                      <p className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                        ₹{item.totalRevenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 5: FINANCIAL & CASH FLOW
        ============================================================ */}
        {activeTab === "FINANCIAL" && (
          <div className="space-y-5">
            {/* 3 Main Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Total Payments Collected
                </span>
                <p className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                  ₹{stats.totalPaymentsReceived.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Across all cash, UPI, cards, and bank payments
                </p>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-4 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Total Outflows (Labor + Expenses)
                </span>
                <p className="text-3xl font-extrabold font-mono text-rose-700 dark:text-rose-300">
                  ₹{(stats.totalTailorCommission + stats.totalExpenses).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tailors: ₹{stats.totalTailorCommission} · Shop Expenses: ₹{stats.totalExpenses}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/20 p-4 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Net Cash Profit / Margin
                </span>
                <p className="text-3xl font-extrabold font-mono text-primary">
                  ₹{stats.netCashMargin.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Retained earnings from tailoring operations
                </p>
              </div>
            </div>

            {/* Payment Modes Distribution */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Payment Modes & Channels Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethodsDistribution.map((pm) => (
                  <div
                    key={pm.method}
                    className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1 text-center"
                  >
                    <p className="text-xs font-bold text-muted-foreground uppercase">{pm.method}</p>
                    <p className="text-xl font-extrabold font-mono text-foreground">
                      ₹{pm.total.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {pm.count} txns ({pm.percentage}%)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: WHOLE WORK AUDIT REGISTER
        ============================================================ */}
        {activeTab === "AUDIT_LOG" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search order #, customer, garment, tailor, cutter..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-background text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Stage:</span>
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Stages</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READY">Ready</option>
                  <option value="STITCHING">Stitching</option>
                  <option value="CUTTING">Cutting</option>
                  <option value="FABRIC_CUT">Fabric Cut</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="rounded-xl text-xs gap-1.5 h-9"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Register</span>
                </Button>
              </div>
            </div>

            {/* Audit Listing */}
            {auditLogItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-xs text-muted-foreground">
                No garments found matching the filters.
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                  <span>Showing {auditLogItems.length} whole work garments</span>
                </div>

                {auditLogItems.map((item) => (
                  <div
                    key={item.garmentId}
                    className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 hover:border-border/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-muted-foreground">
                          📅 {item.orderDate || (item.createdAt ? item.createdAt.substring(0, 10) : "—")}
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${item.orderId}`)}
                          className="font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Order #{item.orderId}
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <Badge variant="outline" className="text-[10px] font-bold">
                          G{item.garmentIndexInOrder}/{item.totalGarmentsInOrder}
                        </Badge>

                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                            garmentStatusColor[item.status as GarmentStatus] ?? ""
                          }`}
                        >
                          {garmentStatusLabel[item.status as GarmentStatus] || item.status}
                        </span>

                        {item.sampleBookPageNumber && (
                          <span className="text-[11px] text-muted-foreground">
                            📖 Book #{item.sampleBookPageNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-extrabold text-foreground text-sm">
                          {item.serviceName}
                        </span>
                        <span className="text-muted-foreground">
                          Customer: <strong className="text-foreground">{item.customerName}</strong>
                          {item.customerPhone && ` (${item.customerPhone})`}
                        </span>
                        {item.dueDate && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Due: {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 justify-between lg:justify-end">
                      {item.cuttingByWorkerName && (
                        <span className="text-muted-foreground text-[11px]">
                          ✂️ {item.cuttingByWorkerName}
                        </span>
                      )}

                      {item.madeByWorkerName && (
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          🪡 {item.madeByWorkerName}
                        </span>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Price / Comm
                        </span>
                        <span className="font-extrabold font-mono text-foreground">
                          ₹{item.garmentPrice || 0} / ₹{item.tailorCommission || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 7: MONTHLY GST & CA REPORTS
        ============================================================ */}
        {activeTab === "CA_REPORTS" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-card to-muted/30 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Monthly GST Turnover & CA Export Portal
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official billing reports, GST input/output breakdown, and Chartered Accountant export sheets
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(2026, i, 1), "MMMM")}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  onClick={fetchMonthlyAndCa}
                  disabled={loadingCa}
                  className="rounded-xl text-xs h-8"
                >
                  Fetch
                </Button>
              </div>
            </div>

            {loadingCa ? (
              <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
            ) : monthlyTaxReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Total Invoices
                    </span>
                    <p className="text-2xl font-extrabold font-mono mt-1">
                      {monthlyTaxReport.invoiceCount}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Gross Turnover
                    </span>
                    <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{monthlyTaxReport.totalTurnover?.toLocaleString("en-IN") || 0}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Taxable Value
                    </span>
                    <p className="text-2xl font-extrabold font-mono mt-1">
                      ₹{monthlyTaxReport.taxableAmount?.toLocaleString("en-IN") || 0}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Total GST Collected
                    </span>
                    <p className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{monthlyTaxReport.totalTax?.toLocaleString("en-IN") || 0}
                    </p>
                  </div>
                </div>

                {/* CA Export Download CTA */}
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      Download CA Financial Export Sheet
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Formatted ready for your accountant or chartered accountant with HSN codes, invoice dates, and tax split
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!caExportData) {
                        toast.error("No CA data available");
                        return;
                      }
                      const jsonStr = JSON.stringify(caExportData, null, 2);
                      const blob = new Blob([jsonStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `ca_export_${selectedMonth}_${selectedYear}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("CA Export downloaded!");
                    }}
                    className="rounded-xl text-xs gap-1.5 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 h-9"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CA Data</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-xs text-muted-foreground">
                Click Fetch to load monthly GST statement for the selected month/year.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
