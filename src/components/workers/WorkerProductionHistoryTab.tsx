import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  Search,
  Layers,
  Scissors,
  Award,
  DollarSign,
  Printer,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getWorkAllocations } from "@/services/workerService";
import { getServices } from "@/services/serviceService";
import type { Worker, WorkAllocationItem } from "@/types/worker";
import type { Service } from "@/types/service";
import { garmentStatusColor, garmentStatusLabel } from "@/utils/productionUtils";
import type { GarmentStatus } from "@/types/order";

interface WorkerProductionHistoryTabProps {
  workers: Worker[];
}

type DatePreset = "ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30" | "CUSTOM";
type SortOption =
  | "DATE_DESC"
  | "DATE_ASC"
  | "SERVICE_ASC"
  | "SERVICE_DESC"
  | "WORKER_ASC"
  | "WORKER_DESC"
  | "COMMISSION_DESC"
  | "COMMISSION_ASC"
  | "ORDER_DESC";

export function WorkerProductionHistoryTab({
  workers,
}: WorkerProductionHistoryTabProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<WorkAllocationItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "ALL">("ALL");
  const [selectedServiceId, setSelectedServiceId] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allocationsData, servicesData] = await Promise.all([
        getWorkAllocations(),
        getServices().catch(() => ({ content: [] as Service[] })),
      ]);

      // Only consider garments that have been allocated to a worker (have madeByWorkerId)
      // or cut by a master, so we track who made/cut what!
      setItems(allocationsData);
      if (servicesData?.content) {
        setServices(servicesData.content);
      }
    } catch (err) {
      console.error("Failed to load production history:", err);
      toast.error("Could not load production history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract all distinct service names/IDs from items + catalog
  const availableServices = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of services) {
      if (s.id && s.name) {
        map.set(s.id, s.name);
      }
    }
    for (const it of items) {
      if (it.serviceId && it.serviceName) {
        map.set(it.serviceId, it.serviceName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [services, items]);

  // Handle Preset changes
  const handlePresetChange = (preset: DatePreset) => {
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
    } else if (preset === "LAST_30") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Must have a worker or cutter associated (who made/cut it)
      const hasWorkerOrCutter = !!item.madeByWorkerId || !!item.cuttingByWorkerId;
      if (!hasWorkerOrCutter) return false;

      // Worker Filter: match madeBy OR cutBy
      if (selectedWorkerId !== "ALL") {
        const matchesMadeBy = item.madeByWorkerId === selectedWorkerId;
        const matchesCutBy = item.cuttingByWorkerId === selectedWorkerId;
        if (!matchesMadeBy && !matchesCutBy) return false;
      }

      // Service Filter
      if (selectedServiceId !== "ALL" && item.serviceId !== selectedServiceId) {
        return false;
      }

      // Status Filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      // Date Range Filter
      if (startDate || endDate) {
        const itemDateStr = item.orderDate || (item.createdAt ? item.createdAt.substring(0, 10) : "");
        if (itemDateStr) {
          if (startDate && itemDateStr < startDate) return false;
          if (endDate && itemDateStr > endDate) return false;
        }
      }

      // Search Filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesOrder = item.orderId.toString().includes(q);
        const matchesGarment = item.garmentId.toString().includes(q);
        const matchesCustomer = item.customerName.toLowerCase().includes(q);
        const matchesPhone = item.customerPhone ? item.customerPhone.includes(q) : false;
        const matchesService = item.serviceName.toLowerCase().includes(q);
        const matchesWorker = item.madeByWorkerName
          ? item.madeByWorkerName.toLowerCase().includes(q)
          : false;
        const matchesCutter = item.cuttingByWorkerName
          ? item.cuttingByWorkerName.toLowerCase().includes(q)
          : false;
        const matchesBook = item.sampleBookPageNumber
          ? item.sampleBookPageNumber.toLowerCase().includes(q)
          : false;

        if (
          !matchesOrder &&
          !matchesGarment &&
          !matchesCustomer &&
          !matchesPhone &&
          !matchesService &&
          !matchesWorker &&
          !matchesCutter &&
          !matchesBook
        ) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedWorkerId, selectedServiceId, statusFilter, startDate, endDate, search]);

  // Apply Sorting
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    list.sort((a, b) => {
      switch (sortBy) {
        case "DATE_DESC": {
          const dateA = a.orderDate || a.createdAt || "";
          const dateB = b.orderDate || b.createdAt || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return b.garmentId - a.garmentId;
        }
        case "DATE_ASC": {
          const dateA = a.orderDate || a.createdAt || "";
          const dateB = b.orderDate || b.createdAt || "";
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return a.garmentId - b.garmentId;
        }
        case "SERVICE_ASC":
          return a.serviceName.localeCompare(b.serviceName);
        case "SERVICE_DESC":
          return b.serviceName.localeCompare(a.serviceName);
        case "WORKER_ASC": {
          const nameA = a.madeByWorkerName || "";
          const nameB = b.madeByWorkerName || "";
          return nameA.localeCompare(nameB);
        }
        case "WORKER_DESC": {
          const nameA = a.madeByWorkerName || "";
          const nameB = b.madeByWorkerName || "";
          return nameB.localeCompare(nameA);
        }
        case "COMMISSION_DESC":
          return (Number(b.tailorCommission) || 0) - (Number(a.tailorCommission) || 0);
        case "COMMISSION_ASC":
          return (Number(a.tailorCommission) || 0) - (Number(b.tailorCommission) || 0);
        case "ORDER_DESC":
          return b.orderId - a.orderId;
        default:
          return 0;
      }
    });

    return list;
  }, [filteredItems, sortBy]);

  // Metrics and statistics
  const stats = useMemo(() => {
    const totalGarments = sortedItems.length;
    const totalCommission = sortedItems.reduce(
      (sum, item) => sum + (Number(item.tailorCommission) || 0),
      0
    );
    const totalGarmentPrice = sortedItems.reduce(
      (sum, item) => sum + (Number(item.garmentPrice) || 0),
      0
    );

    // Breakdown by Service Type
    const serviceCounts = new Map<string, number>();
    for (const it of sortedItems) {
      serviceCounts.set(it.serviceName, (serviceCounts.get(it.serviceName) || 0) + 1);
    }
    const topServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Breakdown by Worker
    const workerCounts = new Map<string, { count: number; commission: number }>();
    for (const it of sortedItems) {
      const wName = it.madeByWorkerName || "Unassigned";
      const curr = workerCounts.get(wName) || { count: 0, commission: 0 };
      curr.count += 1;
      curr.commission += Number(it.tailorCommission) || 0;
      workerCounts.set(wName, curr);
    }
    const topWorkers = Array.from(workerCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4);

    return {
      totalGarments,
      totalCommission: Math.round(totalCommission),
      totalGarmentPrice: Math.round(totalGarmentPrice),
      topServices,
      topWorkers,
    };
  }, [sortedItems]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-card via-card to-muted/30 border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              📊
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-foreground">
              Worker Production History & Garment Records
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Track which worker made each garment, who cut it, filter by service type (Kurta, Pant, Shirt), sort date-wise, and inspect tailor commissions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs gap-1.5 h-8 sm:h-9"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            disabled={loading}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Garments Produced
            </p>
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground">
              {stats.totalGarments}{" "}
              <span className="text-xs font-normal text-muted-foreground">pcs</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 truncate">
              Tailor Commission
            </p>
            <p className="text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              ₹{stats.totalCommission.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80 truncate">
              Garments Value
            </p>
            <p className="text-lg sm:text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
              ₹{stats.totalGarmentPrice.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 truncate">
              Top Service
            </p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 truncate">
              {stats.topServices[0] ? `${stats.topServices[0][0]} (${stats.topServices[0][1]})` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-xs">
        {/* ROW 1: Search & Quick Presets */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search order #, garment #, customer, book #, worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-background text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>

          {/* Date Presets */}
          <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 -mx-1 px-1 sm:mx-0 sm:px-0">
            {(
              [
                { id: "ALL", label: "All Time" },
                { id: "TODAY", label: "Today" },
                { id: "YESTERDAY", label: "Yesterday" },
                { id: "THIS_WEEK", label: "This Week" },
                { id: "THIS_MONTH", label: "This Month" },
                { id: "LAST_30", label: "30 Days" },
                { id: "CUSTOM", label: "Custom" },
              ] as { id: DatePreset; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
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

        {/* ROW 2: Dropdowns (Worker, Service Type, Stage/Status, Sort By, and Custom Date Range) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Worker Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Worker (Tailor / Master)
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) =>
                setSelectedWorkerId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Workers & Tailors</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.workerSpecialty})
                </option>
              ))}
            </select>
          </div>

          {/* Service Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Service Type
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) =>
                setSelectedServiceId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Service Types</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Status Stage
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Stages</option>
              <option value="READY">✅ Ready for Delivery</option>
              <option value="DELIVERED">🎉 Delivered to Customer</option>
              <option value="STITCHING">🪡 In Stitching</option>
              <option value="IRONING">♨️ In Ironing</option>
              <option value="CUTTING">✂️ In Cutting</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="DATE_DESC">Date (Newest First)</option>
              <option value="DATE_ASC">Date (Oldest First)</option>
              <option value="SERVICE_ASC">Service Name (A - Z)</option>
              <option value="SERVICE_DESC">Service Name (Z - A)</option>
              <option value="WORKER_ASC">Worker Name (A - Z)</option>
              <option value="WORKER_DESC">Worker Name (Z - A)</option>
              <option value="COMMISSION_DESC">Commission (High to Low)</option>
              <option value="COMMISSION_ASC">Commission (Low to High)</option>
              <option value="ORDER_DESC">Order # (High to Low)</option>
            </select>
          </div>

          {/* Custom Date Inputs (when CUSTOM or for fine tuning) */}
          <div className="space-y-1 col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Custom Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="w-1/2 rounded-xl border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="w-1/2 rounded-xl border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Service Badges (Click to Filter) */}
        {stats.topServices.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
              Popular Services:
            </span>
            {stats.topServices.map(([sName, count]) => (
              <button
                key={sName}
                type="button"
                onClick={() => {
                  const sObj = availableServices.find((s) => s.name === sName);
                  if (sObj) {
                    setSelectedServiceId((prev) => (prev === sObj.id ? "ALL" : sObj.id));
                  }
                }}
                className="px-2 py-0.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{sName}</span>
                <span className="px-1 rounded-full bg-background text-[10px] font-bold text-primary">
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RECORDS LISTING */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 rounded-2xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            No Production Records Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No garments match the selected worker, service type, date range, or search criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedWorkerId("ALL");
              setSelectedServiceId("ALL");
              setStatusFilter("ALL");
              setDatePreset("ALL");
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-xl text-xs"
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
            <span>
              Showing {sortedItems.length} garment{sortedItems.length === 1 ? "" : "s"} produced
            </span>
            <span>Sorted by {sortBy.replace("_", " ").toLowerCase()}</span>
          </div>

          {/* TABLE / CARD VIEW */}
          <div className="space-y-2.5">
            {sortedItems.map((item) => {
              const displayDate = item.orderDate || (item.createdAt ? item.createdAt.substring(0, 10) : "—");

              return (
                <motion.div
                  key={item.garmentId}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 hover:border-border/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-xs"
                >
                  {/* Left: Identification & Customer Info */}
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        📅 {displayDate}
                      </span>

                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${item.orderId}`)}
                        className="font-extrabold text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Order #{item.orderId}
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <Badge variant="outline" className="text-[10px] font-bold">
                        Garment {item.garmentIndexInOrder}/{item.totalGarmentsInOrder}
                      </Badge>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          garmentStatusColor[item.status as GarmentStatus] ??
                          "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {garmentStatusLabel[item.status as GarmentStatus] || item.status}
                      </span>

                      {item.sampleBookPageNumber && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          📖 Book #{item.sampleBookPageNumber}
                        </span>
                      )}
                    </div>

                    {/* Service & Customer Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
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
                      {item.garmentPrice && (
                        <span className="text-muted-foreground font-medium">
                          Price: ₹{item.garmentPrice}
                        </span>
                      )}
                    </div>

                    {/* Add-ons list if any */}
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          Add-ons:
                        </span>
                        {item.addOns.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/70 bg-muted/30 text-[10px]"
                          >
                            {a.imageUrl && (
                              <img
                                src={a.imageUrl}
                                alt={a.name}
                                className="w-3.5 h-3.5 rounded-xs object-cover"
                              />
                            )}
                            <span className="font-semibold">{a.name}</span>
                            {a.quantity > 1 && (
                              <span className="text-muted-foreground">x{a.quantity}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Worker attribution & commission */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 justify-between lg:justify-end">
                    {/* Master Cutter Badge */}
                    {item.cuttingByWorkerName && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/40 border border-border text-xs">
                        <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-[11px]">Cutter:</span>
                        <span className="font-bold text-foreground text-[11px]">
                          {item.cuttingByWorkerName}
                        </span>
                      </div>
                    )}

                    {/* Tailor Made By Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                      {item.madeByWorkerImage ? (
                        <img
                          src={item.madeByWorkerImage}
                          alt={item.madeByWorkerName || "Tailor"}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-extrabold">
                          {item.madeByWorkerName?.[0] || "T"}
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase font-bold text-indigo-600/80 dark:text-indigo-400/80 leading-none">
                          Stitched / Made By
                        </p>
                        <p className="text-xs font-bold leading-tight">
                          {item.madeByWorkerName || "Not assigned"}
                        </p>
                      </div>
                    </div>

                    {/* Tailor Commission Badge */}
                    {item.tailorCommission && (
                      <div className="text-right pl-1">
                        <p className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80 leading-none">
                          Commission
                        </p>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{item.tailorCommission}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
