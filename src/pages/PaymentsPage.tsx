import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IndianRupee,
  RefreshCw,
  PlusCircle,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPaymentTransactions,
  getPaymentAnalytics,
} from "@/services/paymentService";
import type {
  PaymentTransaction,
  PaymentAnalytics,
  PageResponse,
} from "@/types/payment";
import type { PaymentMethod, PaymentType } from "@/types/order";
import PaymentStatsCards from "@/components/payments/PaymentStatsCards";
import PaymentDateFilterBar, {
  type DatePreset,
} from "@/components/payments/PaymentDateFilterBar";
import PaymentFiltersToolbar from "@/components/payments/PaymentFiltersToolbar";
import PaymentTransactionsTable from "@/components/payments/PaymentTransactionsTable";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import DeliveredUnpaidOrdersCard from "@/components/payments/DeliveredUnpaidOrdersCard";

function getFormattedDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    searchParams.get("tab") === "unpaid" ? "unpaid" : "transactions";

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", val);
      return p;
    });
  };

  const todayStr = useMemo(() => getFormattedDate(new Date()), []);

  // Date Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [startDate, setStartDate] = useState<string>(() =>
    getFormattedDate(new Date())
  );
  const [endDate, setEndDate] = useState<string>(() =>
    getFormattedDate(new Date())
  );

  // Other filters
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "ALL">("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  // Data states
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [transactionsData, setTransactionsData] =
    useState<PageResponse<PaymentTransaction> | null>(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Persistent Today Cache so "Today's Collection" card never wipes to 0 on filter switch
  const [persistedTodayStats, setPersistedTodayStats] = useState<{
    total: number;
    count: number;
  }>({ total: 0, count: 0 });

  // Persistent Delivered Unpaid cache
  const [persistedDeliveredUnpaid, setPersistedDeliveredUnpaid] = useState<{
    balance: number;
    count: number;
  }>({ balance: 0, count: 0 });

  // Monotonic request ID counter to prevent out-of-order race conditions
  const reqIdRef = useRef(0);

  // Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Preset Handler
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "today") {
      const t = getFormattedDate(now);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = getFormattedDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "last7") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setStartDate(getFormattedDate(start));
      setEndDate(getFormattedDate(now));
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(getFormattedDate(start));
      setEndDate(getFormattedDate(now));
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
    setPage(0);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Synchronous in-memory fallback calculated from loaded transactionsData
  const fallbackStats = useMemo(() => {
    const list = transactionsData?.content || [];
    const count = transactionsData?.totalElements ?? list.length;
    const total = list.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    );
    const bd: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CHEQUE: 0,
    };
    for (const t of list) {
      const m = t.paymentMethod
        ? String(t.paymentMethod).toUpperCase()
        : "CASH";
      bd[m] = (bd[m] || 0) + (Number(t.amount) || 0);
    }

    // Check for today's transactions in current list
    let todayListTotal = 0;
    let todayListCount = 0;
    for (const t of list) {
      if (t.paidAt && String(t.paidAt).startsWith(todayStr)) {
        todayListTotal += Number(t.amount) || 0;
        todayListCount += 1;
      }
    }

    return { count, total, bd, todayListTotal, todayListCount };
  }, [transactionsData, todayStr]);

  // Update today cache whenever new today data is detected
  useEffect(() => {
    const sTotal = analytics?.todayTotal ?? analytics?.todayTotalAmount;
    const sCount = analytics?.todayCount ?? analytics?.todayPaymentCount;
    if (typeof sTotal === "number" && !isNaN(sTotal)) {
      setPersistedTodayStats({
        total: sTotal,
        count: Number(sCount ?? 0),
      });
    } else if (fallbackStats.todayListCount > 0) {
      setPersistedTodayStats({
        total: fallbackStats.todayListTotal,
        count: fallbackStats.todayListCount,
      });
    }
  }, [analytics, fallbackStats.todayListCount, fallbackStats.todayListTotal]);

  // Update delivered unpaid cache
  useEffect(() => {
    const dCount = analytics?.deliveredUnpaidCount;
    const dBalance =
      analytics?.deliveredUnpaidTotalBalance ?? analytics?.deliveredUnpaidBalance;
    if (typeof dCount === "number" && !isNaN(dCount)) {
      setPersistedDeliveredUnpaid({
        balance: Number(dBalance ?? 0),
        count: dCount,
      });
    }
  }, [analytics]);

  // ============================================================
  // UNIFIED METRIC RESOLVERS (Directly mapped to requested fields)
  // ============================================================

  // 1. Selected Period Total (rangeTotal)
  const displayRangeTotal = useMemo(() => {
    const val = analytics?.rangeTotal ?? analytics?.rangeTotalAmount;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
    return fallbackStats.total;
  }, [analytics, fallbackStats.total]);

  // 2. Selected Period Transactions Count (rangePaymentCount)
  const displayRangePaymentCount = useMemo(() => {
    const val = analytics?.rangePaymentCount ?? analytics?.rangeCount;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
    return fallbackStats.count;
  }, [analytics, fallbackStats.count]);

  // 3. Today's Collection Total (todayTotal)
  const displayTodayTotal = useMemo(() => {
    if (datePreset === "today") {
      return displayRangeTotal;
    }
    const val = analytics?.todayTotal ?? analytics?.todayTotalAmount;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
    if (persistedTodayStats.total > 0) {
      return persistedTodayStats.total;
    }
    return fallbackStats.todayListTotal;
  }, [datePreset, displayRangeTotal, analytics, persistedTodayStats.total, fallbackStats.todayListTotal]);

  // 4. Today's Payments Count (todayCount)
  const displayTodayCount = useMemo(() => {
    if (datePreset === "today") {
      return displayRangePaymentCount;
    }
    const val = analytics?.todayCount ?? analytics?.todayPaymentCount;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
    if (persistedTodayStats.count > 0) {
      return persistedTodayStats.count;
    }
    return fallbackStats.todayListCount;
  }, [datePreset, displayRangePaymentCount, analytics, persistedTodayStats.count, fallbackStats.todayListCount]);

  // 5. Payment Method Breakdown (paymentMethodBreakdown)
  const activeMethodBreakdown = useMemo(() => {
    const serverBd =
      analytics?.paymentMethodBreakdown ||
      analytics?.methodBreakdown;
    if (
      serverBd &&
      Object.values(serverBd).some((v) => Number(v) > 0)
    ) {
      return serverBd;
    }
    return fallbackStats.bd;
  }, [analytics?.paymentMethodBreakdown, analytics?.methodBreakdown, fallbackStats.bd]);

  // 6. Delivered Unpaid Total Balance (deliveredUnpaidTotalBalance)
  const displayDeliveredUnpaidTotalBalance = useMemo(() => {
    const val =
      analytics?.deliveredUnpaidTotalBalance ?? analytics?.deliveredUnpaidBalance;
    if (typeof val === "number") {
      return val;
    }
    return persistedDeliveredUnpaid.balance;
  }, [analytics, persistedDeliveredUnpaid.balance]);

  // 7. Delivered Unpaid Orders Count (deliveredUnpaidCount)
  const displayDeliveredUnpaidCount = useMemo(() => {
    const val = analytics?.deliveredUnpaidCount;
    if (typeof val === "number") {
      return val;
    }
    return persistedDeliveredUnpaid.count;
  }, [analytics, persistedDeliveredUnpaid.count]);

  const periodLabel = useMemo(() => {
    switch (datePreset) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "last7":
        return "Last 7 Days";
      case "thisMonth":
        return "This Month";
      case "all":
        return "All Time";
      case "custom":
        return startDate && endDate
          ? `${startDate} to ${endDate}`
          : startDate || endDate || "Custom Range";
      default:
        return "Selected Period";
    }
  }, [datePreset, startDate, endDate]);

  // Combined, race-condition protected data fetcher
  const fetchData = useCallback(
    async (targetPage = page) => {
      const currentReqId = ++reqIdRef.current;
      setAnalyticsLoading(true);
      setTransactionsLoading(true);

      const filterParams = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        method: methodFilter,
        type: typeFilter,
        keyword: debouncedKeyword,
      };

      try {
        const [analyticsRes, txRes] = await Promise.allSettled([
          getPaymentAnalytics(filterParams),
          getPaymentTransactions({
            ...filterParams,
            page: targetPage,
            size: pageSize,
          }),
        ]);

        // Ignore stale responses if user triggered another filter in the meantime
        if (currentReqId !== reqIdRef.current) return;

        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value);
        } else {
          console.warn("[Payments] Analytics fetch fallback triggered:", analyticsRes.reason);
        }

        if (txRes.status === "fulfilled") {
          setTransactionsData(txRes.value);
        } else {
          console.error("[Payments] Transactions fetch failed:", txRes.reason);
        }
      } finally {
        if (currentReqId === reqIdRef.current) {
          setAnalyticsLoading(false);
          setTransactionsLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [startDate, endDate, methodFilter, typeFilter, debouncedKeyword, page, pageSize]
  );

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const handleRefreshAll = () => {
    fetchData(page);
  };

  const handleResetFilters = () => {
    setDatePreset("today");
    applyPreset("today");
    setMethodFilter("ALL");
    setTypeFilter("ALL");
    setSearchKeyword("");
    setDebouncedKeyword("");
    setPage(0);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-7xl animate-in fade-in-50 duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <IndianRupee className="h-5 w-5" />
            </div>
            Payments & Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily income, analyze payments over date ranges, and monitor
            pending balances from delivered orders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-9 gap-1.5 font-medium"
            disabled={analyticsLoading || transactionsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                analyticsLoading || transactionsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setRecordModalOpen(true)}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* ================= DATE PRESETS BAR ================= */}
      <PaymentDateFilterBar
        datePreset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onSelectPreset={applyPreset}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(0);
        }}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(0);
        }}
      />

      {/* ================= KPI STATS CARDS ================= */}
      <PaymentStatsCards
        todayTotal={displayTodayTotal}
        todayCount={displayTodayCount}
        rangeTotal={displayRangeTotal}
        rangePaymentCount={displayRangePaymentCount}
        paymentMethodBreakdown={activeMethodBreakdown}
        deliveredUnpaidTotalBalance={displayDeliveredUnpaidTotalBalance}
        deliveredUnpaidCount={displayDeliveredUnpaidCount}
        periodLabel={periodLabel}
        loading={initialLoading}
        syncing={analyticsLoading || transactionsLoading}
        onViewUnpaid={() => handleTabChange("unpaid")}
      />

      {/* ================= TABS NAVIGATION ================= */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger
              value="transactions"
              className="gap-2 text-xs font-semibold"
            >
              <Receipt className="h-4 w-4" />
              Payment Transactions
              {transactionsData && (
                <span className="ml-1 rounded-full bg-background px-1.5 py-0.2 text-[10px] font-bold font-mono" data-no-translate>
                  {transactionsData.totalElements}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-2 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Delivered But Unpaid
              {displayDeliveredUnpaidCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold font-mono" data-no-translate>
                  {displayDeliveredUnpaidCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: ALL TRANSACTIONS */}
        <TabsContent
          value="transactions"
          className="space-y-4 focus-visible:outline-none"
        >
          {/* Filters Toolbar */}
          <PaymentFiltersToolbar
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            onSearchClear={() => {
              setSearchKeyword("");
              setDebouncedKeyword("");
              setPage(0);
            }}
            methodFilter={methodFilter}
            onMethodChange={(val) => {
              setMethodFilter(val);
              setPage(0);
            }}
            typeFilter={typeFilter}
            onTypeChange={(val) => {
              setTypeFilter(val);
              setPage(0);
            }}
            onResetFilters={handleResetFilters}
          />

          {/* Transactions Table */}
          <PaymentTransactionsTable
            transactions={transactionsData?.content ?? []}
            totalElements={transactionsData?.totalElements ?? 0}
            totalPages={transactionsData?.totalPages ?? 0}
            page={page}
            pageSize={pageSize}
            loading={transactionsLoading}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </TabsContent>

        {/* TAB 2: DELIVERED BUT UNPAID */}
        <TabsContent
          value="unpaid"
          className="space-y-4 focus-visible:outline-none"
        >
          <DeliveredUnpaidOrdersCard
            compact={false}
            onRefreshParent={() => fetchData(0)}
          />
        </TabsContent>
      </Tabs>

      {/* Manual / General Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
}

