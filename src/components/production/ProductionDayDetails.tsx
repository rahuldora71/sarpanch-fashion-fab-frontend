import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  ExternalLink,
  Package,
  CheckCircle2,
  Users,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  getDayDetails,
  updateGarmentStageStatus,
} from "@/services/productionCalendarService";
import type {
  DayDetailResponse,
  OrderProductionProgressSummary,
  ScheduledGarmentSummary,
} from "@/types/productionCalendar";
import type { GarmentStatus } from "@/types/cutting";
import {
  capacityStatusColor,
  dominantPhaseStyle,
  garmentStatusColor,
  garmentStatusLabel,
  computeOrderProgressFromGarments,
  type CapacityStatus,
} from "@/utils/productionUtils";

interface Props {
  date: string | null;
  open: boolean;
  onClose: () => void;
  /** Render directly inside a card panel instead of a modal sheet */
  inline?: boolean;
  /** Callback when a garment's status is updated so parent calendar can refresh */
  onStatusUpdated?: () => void;
}

const GARMENT_STAGE_OPTIONS: { value: GarmentStatus; label: string }[] = [
  { value: "FABRIC_CUT", label: "✂️ Pending Cut" },
  { value: "CUTTING", label: "✂️ In Cutting" },
  { value: "STITCHING", label: "🪡 Stitching" },
  { value: "WASHING", label: "🧼 Washing" },
  { value: "IRONING", label: "♨️ Ironing" },
  { value: "READY", label: "✅ Ready" },
  { value: "DELIVERED", label: "🎉 Delivered" },
];

/**
 * Day detail inspector (supports both Sheet drawer and Inline side-panel).
 * Shows Order-level dominant phase progress, strict delivery tracking,
 * interactive garment status switcher, and capacity/attendance metrics.
 */
export default function ProductionDayDetails({
  date,
  open,
  onClose,
  inline = false,
  onStatusUpdated,
}: Props) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DayDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingGarmentId, setUpdatingGarmentId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    if ((open || inline) && date) {
      loadDetail(date);
    }
    if (!open && !inline) {
      setDetail(null);
    }
  }, [open, inline, date]);

  const loadDetail = async (d: string) => {
    setLoading(true);
    try {
      const data = await getDayDetails(d);
      setDetail(data);
    } catch {
      // ignore error
    } finally {
      setLoading(false);
    }
  };

  // Compute order progress list (uses backend `detail.orders` or client-side fallback grouped by orderId)
  const ordersList: OrderProductionProgressSummary[] = useMemo(() => {
    if (!detail) return [];
    if (detail.orders && detail.orders.length > 0) {
      return detail.orders;
    }
    const grouped = new Map<number, ScheduledGarmentSummary[]>();
    for (const g of detail.garments ?? []) {
      const existing = grouped.get(g.orderId) ?? [];
      existing.push(g);
      grouped.set(g.orderId, existing);
    }
    return Array.from(grouped.entries()).map(([orderId, garments]) =>
      computeOrderProgressFromGarments(orderId, garments)
    );
  }, [detail]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "ALL") return ordersList;
    return ordersList.filter((o) => o.dominantPhase === activeFilter);
  }, [ordersList, activeFilter]);

  const handleGarmentStatusChange = async (garmentId: number, newStatus: GarmentStatus) => {
    setUpdatingGarmentId(garmentId);
    try {
      await updateGarmentStageStatus(garmentId, newStatus);
      toast.success(`Garment stage updated to ${garmentStatusLabel[newStatus] || newStatus}`);
      if (date) {
        await loadDetail(date);
      }
      onStatusUpdated?.();
    } catch {
      toast.error("Failed to update garment stage");
    } finally {
      setUpdatingGarmentId(null);
    }
  };

  const summary = detail?.summary;
  const colors = summary
    ? capacityStatusColor[summary.capacityStatus as CapacityStatus] ?? capacityStatusColor.GREEN
    : capacityStatusColor.GREEN;

  const renderContent = () => {
    if (!date) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Select a Date on the Calendar
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Click any date cell to inspect Order Progress, Dominant Phase comparisons (Cutting vs Ironing/Stitching), and Delivery readiness.
          </p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground">Loading production details...</p>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Unable to load details for this date.
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* SPECIAL STATUS BANNERS */}
          {summary?.isBlocked && (
            <div className="bg-muted/80 dark:bg-slate-900 border border-border rounded-xl p-3 text-sm">
              <strong className="text-foreground">🔒 Date Locked for New Deliveries</strong>
              {summary.blockReason && (
                <p className="text-muted-foreground text-xs mt-0.5">{summary.blockReason}</p>
              )}
            </div>
          )}
          {summary?.isHoliday && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-sm">
              <strong className="text-purple-700 dark:text-purple-300">
                🎉 {summary.holidayName}
              </strong>
              {!summary.deliveryAllowed && (
                <p className="text-purple-600 dark:text-purple-400 text-xs mt-0.5">
                  Deliveries disabled on this holiday
                </p>
              )}
            </div>
          )}
          {summary?.isPowerCut && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm">
              <strong className="text-destructive">⚡ Power Cut / Reduced Capacity</strong>
              {summary.capacityNote && (
                <p className="text-destructive/80 text-xs mt-0.5">{summary.capacityNote}</p>
              )}
            </div>
          )}

          {/* CAPACITY & STAGE SUMMARY GRID */}
          {summary && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/40 dark:bg-muted/20 border border-border/60 rounded-xl p-2.5 text-center">
                <p className="text-base font-bold text-primary">
                  {summary.scheduledOrders ?? ordersList.length}
                </p>
                <p className="text-[11px] text-muted-foreground">Orders Due</p>
              </div>
              <div className="bg-muted/40 dark:bg-muted/20 border border-border/60 rounded-xl p-2.5 text-center">
                <p className="text-base font-bold text-foreground">
                  {summary.scheduledGarments}
                </p>
                <p className="text-[11px] text-muted-foreground">Garments</p>
              </div>
              <div className="bg-muted/40 dark:bg-muted/20 border border-border/60 rounded-xl p-2.5 text-center">
                <p
                  className={`text-base font-bold ${
                    summary.isPowerCut ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {summary.scheduledGarments}/{summary.effectiveCapacity}
                </p>
                <p className="text-[11px] text-muted-foreground">Capacity Used</p>
              </div>
            </div>
          )}

          {/* PHASE FILTER PILLS */}
          {ordersList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "ALL", label: `All Orders (${ordersList.length})` },
                { id: "CUTTING", label: "✂️ Cutting" },
                { id: "STITCHING", label: "🪡 Stitching" },
                { id: "IRONING", label: "♨️ Ironing" },
                { id: "READY_FOR_DELIVERY", label: "✅ Ready" },
                { id: "PARTIALLY_DELIVERED", label: "📦 Partial Delivery" },
                { id: "DELIVERED", label: "🎉 Delivered" },
              ].map((pill) => {
                const active = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          )}

          <Separator />

          {/* ORDER-LEVEL PROGRESS CARDS */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Order Production Progress ({filteredOrders.length})
              </h4>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No orders matching the selected filter for this date.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const phaseStyle =
                  dominantPhaseStyle[order.dominantPhase] ?? dominantPhaseStyle.CUTTING;
                const total = Math.max(order.totalGarments, 1);
                const cutPct = Math.round((order.cuttingCount / total) * 100);
                const stitchPct = Math.round((order.stitchingCount / total) * 100);
                const ironPct = Math.round((order.ironingCount / total) * 100);
                const readyPct = Math.round((order.readyCount / total) * 100);
                const delivPct = Math.round((order.deliveredCount / total) * 100);

                // Check if order has mixed phases (e.g. Cutting + Ironing)
                const activeWorkPhases = [
                  order.cuttingCount > 0 ? `${order.cuttingCount} Cutting` : null,
                  order.stitchingCount > 0 ? `${order.stitchingCount} Stitching` : null,
                  order.ironingCount > 0 ? `${order.ironingCount} Ironing` : null,
                  order.readyCount > 0 ? `${order.readyCount} Ready` : null,
                  order.deliveredCount > 0 ? `${order.deliveredCount} Delivered` : null,
                ].filter(Boolean);

                return (
                  <div
                    key={order.orderId}
                    className={`rounded-xl  border border-border p-3.5 space-y-3 transition-all bg-card shadow-xs ${phaseStyle.cardBorderClass}`}
                  >
                    {/* Top Row: Customer + Navigate to Order */}
                    <div className="flex   items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {order.customerName}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {order.totalGarments} {order.totalGarments === 1 ? "Garment" : "Garments"}
                          </Badge>
                        </div>
                        {order.customerPhone && (
                          <p className="text-[11px] text-muted-foreground">
                            📞 {order.customerPhone}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                        onClick={() => navigate(`/orders/${order.orderId}`)}
                      >
                        Order #{order.orderId}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Dominant Phase Comparison Callout */}
                    <div className="rounded-lg border border-border/70 bg-muted/25 dark:bg-muted/10 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${phaseStyle.badgeClass}`}
                        >
                          {order.dominantPhaseLabel}
                        </span>
                        <span className="text-xs font-extrabold text-foreground">
                          {order.isFullyDelivered
                            ? "100% Complete"
                            : `${order.overallOrderProgress}% Overall`}
                        </span>
                      </div>

                      {/* Explain Dominant Phase Comparison or Partial Delivery Rule */}
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {order.dominantPhase === "PARTIALLY_DELIVERED" ? (
                          <span className="text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {order.deliveredCount} delivered,{" "}
                            {order.totalGarments - order.deliveredCount} remaining — Order stays
                            open until all {order.totalGarments} garments are delivered.
                          </span>
                        ) : order.isFullyDelivered ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            All {order.totalGarments} garments delivered to customer.
                          </span>
                        ) : (
                          <span>
                            Breakdown: {activeWorkPhases.join(" · ")} (Dominant stage:{" "}
                            <strong>{phaseStyle.shortTitle}</strong> at{" "}
                            <strong>{order.dominantPhaseProgress}%</strong>)
                          </span>
                        )}
                      </p>

                      {/* Multi-segment progress bar */}
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-2 rounded-full bg-background/80 dark:bg-slate-900 overflow-hidden flex border border-border/50">
                          {delivPct > 0 && (
                            <div
                              style={{ width: `${delivPct}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Delivered: ${order.deliveredCount}`}
                            />
                          )}
                          {readyPct > 0 && (
                            <div
                              style={{ width: `${readyPct}%` }}
                              className="bg-teal-500 h-full"
                              title={`Ready: ${order.readyCount}`}
                            />
                          )}
                          {ironPct > 0 && (
                            <div
                              style={{ width: `${ironPct}%` }}
                              className="bg-orange-500 h-full"
                              title={`Ironing: ${order.ironingCount}`}
                            />
                          )}
                          {stitchPct > 0 && (
                            <div
                              style={{ width: `${stitchPct}%` }}
                              className="bg-indigo-500 h-full"
                              title={`Stitching: ${order.stitchingCount}`}
                            />
                          )}
                          {cutPct > 0 && (
                            <div
                              style={{ width: `${cutPct}%` }}
                              className="bg-amber-500 h-full"
                              title={`Cutting: ${order.cuttingCount}`}
                            />
                          )}
                        </div>

                        {/* Stage Count Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                          {order.cuttingCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                              ✂️ Cutting: {order.cuttingCount}
                            </span>
                          )}
                          {order.stitchingCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold">
                              🪡 Stitching: {order.stitchingCount}
                            </span>
                          )}
                          {order.ironingCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold">
                              ♨️ Ironing: {order.ironingCount}
                            </span>
                          )}
                          {order.readyCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold">
                              ✅ Ready: {order.readyCount}
                            </span>
                          )}
                          {order.deliveredCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                              🎉 Delivered: {order.deliveredCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual Garments with Quick Stage Switcher */}
                    {order.orderGarments && order.orderGarments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Garments in Order ({order.orderGarments.length})
                        </p>
                        <div className="space-y-1.5">
                          {order.orderGarments.map((g: ScheduledGarmentSummary) => {
                            const statusKey = (g.status as GarmentStatus) || "FABRIC_CUT";
                            return (
                              <div
                                key={g.garmentId}
                                className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/25 dark:bg-muted/10 px-2.5 py-1.5"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {g.serviceName}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                    {g.madeByWorkerName ? (
                                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                        🪡 Made by: {g.madeByWorkerName}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/75">
                                        🪡 Unallocated
                                      </span>
                                    )}
                                    {g.sampleBookPageNumber && (
                                      <span>Book #{g.sampleBookPageNumber}</span>
                                    )}
                                    {g.dueDate && <span>Due: {g.dueDate}</span>}
                                  </div>
                                </div>

                                <select
                                  value={statusKey}
                                  disabled={updatingGarmentId === g.garmentId}
                                  onChange={(e) =>
                                    handleGarmentStatusChange(
                                      g.garmentId,
                                      e.target.value as GarmentStatus
                                    )
                                  }
                                  className={`text-[11px] font-semibold rounded-md px-2 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                                    garmentStatusColor[statusKey] ??
                                    "bg-secondary text-secondary-foreground border-border"
                                  }`}
                                >
                                  {GARMENT_STAGE_OPTIONS.map((opt) => (
                                    <option
                                      key={opt.value}
                                      value={opt.value}
                                      className="bg-popover text-popover-foreground"
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* WORKER ATTENDANCE */}
          {detail.workerAttendance && detail.workerAttendance.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Worker Attendance ({detail.workerAttendance.length})
                </h4>
                <div className="space-y-1.5">
                  {detail.workerAttendance.map((w) => (
                    <div
                      key={w.workerId}
                      className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2 border border-border/60"
                    >
                      <span className="font-medium text-foreground">{w.workerName}</span>
                      <Badge
                        variant="outline"
                        className={
                          w.status === "PRESENT"
                            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : w.status === "HALF_DAY"
                            ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                            : "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }
                      >
                        {w.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (inline) {
    return (
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm flex flex-col h-full overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between gap-2 shrink-0">
          <div>
            <h3 className="font-bold text-base text-foreground">
              {date ? format(parseISO(date), "EEEE, d MMMM yyyy") : "Order Progress Inspector"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Dominant phase comparison & delivery readiness
            </p>
          </div>
          {summary && (
            <Badge
              className={`text-xs ${colors.bg} ${colors.text} border ${colors.border}`}
            >
              {summary.capacityStatus === "GREEN" && "✓ Available"}
              {summary.capacityStatus === "YELLOW" && "⚠ Near Full"}
              {summary.capacityStatus === "RED" && "✗ Overloaded"}
              {summary.capacityStatus === "LOCKED" && "🔒 Locked"}
              {summary.capacityStatus === "HOLIDAY" && "🎉 Holiday"}
            </Badge>
          )}
        </div>
        <div
          className="p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain max-h-[720px] touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full data-[side=right]:w-full sm:data-[side=right]:max-w-lg sm:max-w-lg p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden bg-background text-foreground border-border"
      >
        <SheetHeader className="px-4 sm:px-6 py-4 pr-12 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10 text-left">
          <SheetTitle className="text-foreground text-base sm:text-lg">
            {date ? format(parseISO(date), "EEEE, d MMMM yyyy") : "Day Details"}
          </SheetTitle>
          {summary && (
            <Badge
              className={`mt-1 w-fit text-xs ${colors.bg} ${colors.text} border ${colors.border}`}
            >
              {summary.capacityStatus === "GREEN" && "✓ Capacity Available"}
              {summary.capacityStatus === "YELLOW" && "⚠ Near Capacity"}
              {summary.capacityStatus === "RED" && "✗ Over Capacity"}
              {summary.capacityStatus === "LOCKED" && "🔒 Locked"}
              {summary.capacityStatus === "HOLIDAY" && "🎉 Holiday"}
            </Badge>
          )}
        </SheetHeader>

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 touch-pan-y"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
