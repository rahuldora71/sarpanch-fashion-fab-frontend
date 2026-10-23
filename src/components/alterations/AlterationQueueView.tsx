import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scissors,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Search,
  User,
  Phone,
  ExternalLink,
  RefreshCw,
  Plus,
  Loader2,
  CalendarDays,
  FileText,
  BadgeAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import OrderDeliveryDialog from "@/components/orders/OrderDeliveryDialog";
import { alterationService } from "@/services/alterationService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import type {
  AlterationQueueItem,
  AlterationQueueSummary,
} from "@/types/alteration";

interface AlterationQueueViewProps {
  onNewAlteration: () => void;
}

type DateFilterOption = "ALL" | "OVERDUE" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "CUSTOM";

export default function AlterationQueueView({
  onNewAlteration,
}: AlterationQueueViewProps) {
  const navigate = useNavigate();
  const { getFieldName, getFieldUnit } = useMeasurementFields();

  // Queue state
  const [items, setItems] = useState<AlterationQueueItem[]>([]);
  const [summary, setSummary] = useState<AlterationQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("ALL");
  const [customDate, setCustomDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALTERATION" | "DELIVERED" | "ALL">("ALTERATION");

  // Delivery Dialog state
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<number | null>(null);
  const [quickDeliveringId, setQuickDeliveringId] = useState<number | null>(null);

  // Fetch summary counts
  const loadSummary = useCallback(async () => {
    try {
      const sum = await alterationService.getAlterationQueueSummary();
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load alteration summary:", err);
    }
  }, []);

  // Fetch queue items
  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateFilter === "TODAY") {
        startDate = todayStr;
        endDate = todayStr;
      } else if (dateFilter === "TOMORROW") {
        const tom = new Date(today);
        tom.setDate(tom.getDate() + 1);
        const tomStr = tom.toISOString().split("T")[0];
        startDate = tomStr;
        endDate = tomStr;
      } else if (dateFilter === "OVERDUE") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        endDate = yesterday.toISOString().split("T")[0];
      } else if (dateFilter === "THIS_WEEK") {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        startDate = todayStr;
        endDate = nextWeek.toISOString().split("T")[0];
      } else if (dateFilter === "CUSTOM" && customDate) {
        startDate = customDate;
        endDate = customDate;
      }

      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;

      const response = await alterationService.getAlterationQueue({
        status: statusParam,
        startDate,
        endDate,
        search: searchQuery.trim() || undefined,
        size: 100,
      });

      setItems(response.content || []);
    } catch (err) {
      console.error("Failed to load alteration queue:", err);
      toast.error("Failed to load alterations queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, customDate, statusFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    loadSummary();
    loadQueue();
  }, [loadSummary, loadQueue]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, loadQueue]);

  // Quick deliver action (1-click)
  const handleQuickDeliver = async (item: AlterationQueueItem) => {
    if (quickDeliveringId) return;

    setQuickDeliveringId(item.garmentId);
    try {
      await alterationService.quickDeliverAlteration(
        item.garmentId,
        `Quick-delivered to customer ${item.customerName}`
      );
      toast.success(`Garment #${item.garmentId} (${item.serviceName}) delivered successfully!`);
      loadQueue(true);
      loadSummary();
    } catch (err) {
      console.error("Failed to quick deliver alteration:", err);
      toast.error("Failed to deliver garment.");
    } finally {
      setQuickDeliveringId(null);
    }
  };

  // Open full delivery dialog
  const handleOpenDeliveryDialog = (item: AlterationQueueItem) => {
    setSelectedOrderId(item.orderId);
    setSelectedGarmentId(item.garmentId);
    setDeliveryDialogOpen(true);
  };

  // Group queue items date-wise
  const groupedItems = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split("T")[0];

    const overdue: AlterationQueueItem[] = [];
    const todayList: AlterationQueueItem[] = [];
    const tomorrowList: AlterationQueueItem[] = [];
    const upcoming: AlterationQueueItem[] = [];
    const undated: AlterationQueueItem[] = [];
    const delivered: AlterationQueueItem[] = [];

    items.forEach((item) => {
      if (item.status === "DELIVERED") {
        delivered.push(item);
        return;
      }

      const d = item.alterationDeliveryDate;
      if (!d) {
        undated.push(item);
      } else if (d < todayStr) {
        overdue.push(item);
      } else if (d === todayStr) {
        todayList.push(item);
      } else if (d === tomStr) {
        tomorrowList.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return {
      overdue,
      today: todayList,
      tomorrow: tomorrowList,
      upcoming,
      undated,
      delivered,
    };
  }, [items]);

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "No Date Set";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderItemCard = (item: AlterationQueueItem) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isOverdue = item.alterationDeliveryDate && item.alterationDeliveryDate < todayStr && item.status !== "DELIVERED";
    const isToday = item.alterationDeliveryDate === todayStr;

    return (
      <Card
        key={item.garmentId}
        className={`border transition-all duration-150 hover:shadow-md ${
          isOverdue
            ? "border-red-500/40 bg-red-500/5 dark:bg-red-950/10"
            : isToday
            ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10"
            : item.status === "DELIVERED"
            ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
            : "border-border/80 bg-card hover:border-primary/50"
        }`}
      >
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Header Row: Service, Garment ID, Due Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 shadow-2xs">
                <Scissors className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground truncate">
                    {item.serviceName}
                  </h4>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                    #G-{item.garmentId}
                  </Badge>
                </div>
                {item.sampleNumber && (
                  <p className="text-[11px] text-muted-foreground">
                    Sample / Cloth: <span className="font-mono font-medium text-foreground">{item.sampleNumber}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.status === "DELIVERED" ? (
                <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Delivered
                </Badge>
              ) : isOverdue ? (
                <Badge className="bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400 font-semibold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue ({formatDateDisplay(item.alterationDeliveryDate)})
                </Badge>
              ) : isToday ? (
                <Badge className="bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due Today
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {formatDateDisplay(item.alterationDeliveryDate)}
                </Badge>
              )}
            </div>
          </div>

          {/* Customer & Order Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3 text-xs">
            {/* Customer Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>{item.customerName}</span>
                {item.customerCode && (
                  <span className="font-mono text-[10px] text-muted-foreground bg-background px-1 py-0.2 rounded border">
                    {item.customerCode}
                  </span>
                )}
              </div>
              {item.customerPhone ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <a
                    href={`tel:${item.customerPhone}`}
                    className="hover:underline font-mono text-foreground hover:text-primary transition-colors"
                  >
                    {item.customerPhone}
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">No phone recorded</p>
              )}
            </div>

            {/* Order Details */}
            <div className="space-y-1 sm:text-right">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${item.orderId}`)}
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {item.orderNumber || `Order #${item.orderId}`}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <p className="text-muted-foreground">
                Placed: {formatDateDisplay(item.orderDate)}
                {item.sampleBookPageNumber && ` · Page ${item.sampleBookPageNumber}`}
              </p>
            </div>
          </div>

          {/* Alteration Notes & Adjustments */}
          <div className="space-y-2">
            {item.alterationNote && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5 text-xs text-foreground">
                <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-0.5">
                  Alteration Instructions:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {item.alterationNote}
                </p>
              </div>
            )}

            {/* Specific Measurement Deltas */}
            {item.alterationDeltas && Object.keys(item.alterationDeltas).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Fit Deltas:</span>
                {Object.entries(item.alterationDeltas).map(([fId, delta]) => {
                  const numDelta = Number(delta);
                  const isNum = !isNaN(numDelta);
                  const isTighten = isNum && numDelta < 0;
                  const isLoosen = isNum && numDelta > 0;
                  const fieldName = getFieldName(fId);
                  const unit = getFieldUnit(fId, "in");
                  const unitSymbol = unit.toLowerCase() === "inch" || unit.toLowerCase() === "in" ? '"' : ` ${unit}`;
                  const deltaLabel = isNum ? (numDelta > 0 ? `+${numDelta}${unitSymbol}` : `${numDelta}${unitSymbol}`) : String(delta);

                  return (
                    <Badge
                      key={fId}
                      variant="outline"
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 ${
                        isTighten
                          ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                          : isLoosen
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          : "border-border bg-muted text-foreground"
                      }`}
                    >
                      {fieldName}: {deltaLabel}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Footer: Deliver when customer arrives */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
            <div className="text-xs text-muted-foreground">
              Price: <span className="font-semibold text-foreground">₹{item.price}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/orders/${item.orderId}`)}
                className="text-xs h-8 gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                View Order
              </Button>

              {item.status !== "DELIVERED" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={quickDeliveringId === item.garmentId}
                    onClick={() => handleQuickDeliver(item)}
                    className="text-xs h-8 gap-1 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                    title="1-click delivery without opening dialog"
                  >
                    {quickDeliveringId === item.garmentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Quick Deliver
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleOpenDeliveryDialog(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                    Deliver to Customer
                  </Button>
                </>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Delivered to Customer
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Alteration Queue & Deliveries
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track garments under alteration date-wise and seamlessly deliver them when customers arrive
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSummary();
              loadQueue(true);
            }}
            disabled={refreshing}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={onNewAlteration}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Record New Alteration
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* All Active */}
        <Card
          onClick={() => {
            setDateFilter("ALL");
            setStatusFilter("ALTERATION");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            dateFilter === "ALL" && statusFilter === "ALTERATION"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
              : "hover:border-primary/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Alterations
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mt-1">
            {summary?.totalActive ?? 0}
          </div>
        </Card>

        {/* Overdue */}
        <Card
          onClick={() => {
            setDateFilter("OVERDUE");
            setStatusFilter("ALTERATION");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            dateFilter === "OVERDUE"
              ? "border-red-500 ring-2 ring-red-500/20 bg-red-500/5"
              : "hover:border-red-500/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
            <BadgeAlert className="h-3 w-3" />
            Overdue
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {summary?.overdue ?? 0}
          </div>
        </Card>

        {/* Due Today */}
        <Card
          onClick={() => {
            setDateFilter("TODAY");
            setStatusFilter("ALTERATION");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            dateFilter === "TODAY"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5"
              : "hover:border-amber-500/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due Today
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {summary?.dueToday ?? 0}
          </div>
        </Card>

        {/* Due Tomorrow */}
        <Card
          onClick={() => {
            setDateFilter("TOMORROW");
            setStatusFilter("ALTERATION");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            dateFilter === "TOMORROW"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5"
              : "hover:border-blue-500/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due Tomorrow
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
            {summary?.dueTomorrow ?? 0}
          </div>
        </Card>

        {/* Upcoming */}
        <Card
          onClick={() => {
            setDateFilter("THIS_WEEK");
            setStatusFilter("ALTERATION");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            dateFilter === "THIS_WEEK"
              ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5"
              : "hover:border-purple-500/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            Upcoming
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">
            {summary?.upcoming ?? 0}
          </div>
        </Card>

        {/* Delivered */}
        <Card
          onClick={() => {
            setStatusFilter("DELIVERED");
            setDateFilter("ALL");
          }}
          className={`cursor-pointer transition-all border p-3 ${
            statusFilter === "DELIVERED"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
              : "hover:border-emerald-500/50"
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {summary?.delivered ?? 0}
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, phone, order #ORD-, garment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Status Segmented Control */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs self-start md:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("ALTERATION")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === "ALTERATION"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                In Alteration
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DELIVERED")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === "DELIVERED"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Delivered
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === "ALL"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Status
              </button>
            </div>
          </div>

          {/* Date Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date:
            </span>

            {(["ALL", "OVERDUE", "TODAY", "TOMORROW", "THIS_WEEK", "CUSTOM"] as DateFilterOption[]).map((option) => (
              <Button
                key={option}
                variant={dateFilter === option ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(option)}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                {option === "ALL"
                  ? "All Dates"
                  : option === "OVERDUE"
                  ? "Overdue"
                  : option === "TODAY"
                  ? "Today"
                  : option === "TOMORROW"
                  ? "Tomorrow"
                  : option === "THIS_WEEK"
                  ? "This Week"
                  : "Specific Date"}
              </Button>
            ))}

            {dateFilter === "CUSTOM" && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-7 text-xs w-36 ml-1"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Content List */}
      {loading ? (
        <Card className="border-border">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading alterations queue…</span>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Alterations in Queue</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery || dateFilter !== "ALL" || statusFilter !== "ALTERATION"
                ? "No matching garments found with your active filters. Try resetting the filters."
                : "All garment alterations are completed and delivered! New alterations will appear here."}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              {(searchQuery || dateFilter !== "ALL" || statusFilter !== "ALTERATION") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("ALL");
                    setStatusFilter("ALTERATION");
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNewAlteration}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Record Alteration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Overdue Alterations */}
          {groupedItems.overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400">
                  Overdue Alterations ({groupedItems.overdue.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.overdue.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Section 2: Due Today */}
          {groupedItems.today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Due Today ({groupedItems.today.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.today.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Section 3: Due Tomorrow */}
          {groupedItems.tomorrow.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">
                  <Calendar className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  Due Tomorrow ({groupedItems.tomorrow.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.tomorrow.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Section 4: Upcoming Alterations */}
          {groupedItems.upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-400">
                  <CalendarDays className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300">
                  Upcoming Alterations ({groupedItems.upcoming.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.upcoming.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Section 5: Undated Alterations */}
          {groupedItems.undated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-bold text-muted-foreground">
                  Unscheduled Alterations ({groupedItems.undated.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.undated.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Section 6: Delivered Alterations */}
          {groupedItems.delivered.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Delivered Alterations ({groupedItems.delivered.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {groupedItems.delivered.map(renderItemCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Delivery Dialog */}
      {selectedOrderId && (
        <OrderDeliveryDialog
          isOpen={deliveryDialogOpen}
          onClose={() => {
            setDeliveryDialogOpen(false);
            setSelectedOrderId(null);
            setSelectedGarmentId(null);
          }}
          orderId={selectedOrderId}
          initialGarmentId={selectedGarmentId}
          onSuccess={() => {
            toast.success("Delivery recorded successfully!");
            loadQueue(true);
            loadSummary();
          }}
        />
      )}
    </div>
  );
}
