import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Scissors,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, startOfMonth, getDay } from "date-fns";
import ProductionCalendarDay from "./ProductionCalendarDay";
import ProductionDayDetails from "./ProductionDayDetails";
import { getMonthlyCalendar } from "@/services/productionCalendarService";
import type { DaySummary, ProductionCalendarResponse } from "@/types/productionCalendar";

interface Props {
  /** Called when a date is selected — used by delivery date picker mode */
  onSelectDate?: (date: string) => void;
  /** If true, highlights selectable dates (delivery picker mode) */
  datePickerMode?: boolean;
  /** Dates that are not selectable in picker mode */
  disabledDates?: string[];
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Production-aware monthly calendar with shadcn Dark/Light theme compatibility,
 * Monthly KPI summary cards, and a side-by-side Order Progress Inspector.
 */
export default function ProductionCalendar({
  onSelectDate,
  datePickerMode = false,
  disabledDates = [],
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calData, setCalData] = useState<ProductionCalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  const fetchCalendar = useCallback(async (d: Date) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getMonthlyCalendar(d.getFullYear(), d.getMonth() + 1);
      setCalData(data);

      // Auto-select today if in current month, or first date with scheduled orders
      const todayIso = format(new Date(), "yyyy-MM-dd");
      const hasTodayInMonth = data.days.some((day) => day.date === todayIso);
      const firstActiveDay = data.days.find(
        (day) => (day.scheduledOrders ?? 0) > 0 || day.scheduledGarments > 0
      );

      setSelectedDate((prev) => {
        if (prev && data.days.some((day) => day.date === prev)) {
          return prev;
        }
        if (hasTodayInMonth) return todayIso;
        return firstActiveDay?.date ?? data.days[0]?.date ?? null;
      });
    } catch (err: any) {
      console.error("[ProductionCalendar] Fetch failed:", err);
      setFetchError(err?.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentDate);
  }, [currentDate, fetchCalendar]);

  const goToPrevMonth = () => {
    setSlideDir("left");
    setCurrentDate((d) => subMonths(d, 1));
  };

  const goToNextMonth = () => {
    setSlideDir("right");
    setCurrentDate((d) => addMonths(d, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(format(now, "yyyy-MM-dd"));
  };

  // Monthly aggregated KPIs
  const monthlyStats = useMemo(() => {
    const days = calData?.days ?? [];
    return days.reduce(
      (acc, d) => {
        acc.orders += d.scheduledOrders ?? 0;
        acc.garments += d.scheduledGarments ?? 0;
        acc.cutting += d.ordersInCutting ?? d.cuttingPending ?? 0;
        acc.stitchingIroning +=
          (d.ordersInStitching ?? d.stitchingPending ?? 0) + (d.ordersInIroning ?? 0);
        acc.ready += d.ordersReadyForDelivery ?? 0;
        acc.partialOrders += d.ordersReadyForDelivery ?? 0;
        acc.deliveredOrders += d.ordersFullyDelivered ?? 0;
        acc.deliveredGarments += d.completedGarments ?? 0;
        return acc;
      },
      {
        orders: 0,
        garments: 0,
        cutting: 0,
        stitchingIroning: 0,
        ready: 0,
        partialOrders: 0,
        deliveredOrders: 0,
        deliveredGarments: 0,
      }
    );
  }, [calData]);

  // Build the grid: 7 columns (Mon → Sun), starting with blank cells for offset
  const firstDay = startOfMonth(currentDate);
  const startOffset = (getDay(firstDay) + 6) % 7;
  const dayMap = new Map<string, DaySummary>(
    calData?.days.map((d) => [d.date, d]) ?? []
  );

  const daysInMonth = calData?.days.length ?? 0;
  const totalCells = startOffset + daysInMonth;
  const gridSize = Math.ceil(totalCells / 7) * 7;

  const handleDayClick = (day: DaySummary) => {
    if (datePickerMode && disabledDates.includes(day.date)) return;
    if (datePickerMode && !day.deliveryAllowed) return;

    setSelectedDate(day.date);

    if (datePickerMode && onSelectDate) {
      onSelectDate(day.date);
    } else if (window.innerWidth < 1024) {
      // On mobile/tablet screens, open the slide-over sheet as well
      setDetailOpen(true);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* MONTHLY KPI SUMMARY CARDS (Only in full Production Calendar page) */}
      {!datePickerMode && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Scheduled Load</p>
              <p className="text-lg font-extrabold text-foreground leading-tight">
                <span className="font-mono" data-no-translate>{monthlyStats.orders}</span>{" "}
                <span className="text-xs font-semibold text-muted-foreground">Orders</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-mono font-medium" data-no-translate>{monthlyStats.garments}</span> garments due
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 font-medium">Cutting Phase</p>
              <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 leading-tight">
                <span className="font-mono" data-no-translate>{monthlyStats.cutting}</span>{" "}
                <span className="text-xs font-semibold">Pcs</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Awaiting / in cutting</p>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 font-medium">Stitching & Iron</p>
              <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300 leading-tight">
                <span className="font-mono" data-no-translate>{monthlyStats.stitchingIroning}</span>{" "}
                <span className="text-xs font-semibold">Pcs</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Active floor work</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 dark:bg-sky-950/20 p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-sky-700/80 dark:text-sky-300/80 font-medium">Ready / Partial</p>
              <p className="text-lg font-extrabold text-sky-700 dark:text-sky-300 leading-tight">
                <span className="font-mono" data-no-translate>{monthlyStats.ready}</span>{" "}
                <span className="text-xs font-semibold">Ready</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-mono font-medium" data-no-translate>{monthlyStats.partialOrders}</span> partial orders open
              </p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-medium">All Delivered</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 leading-tight">
                <span className="font-mono" data-no-translate>{monthlyStats.deliveredOrders}</span>{" "}
                <span className="text-xs font-semibold">Orders</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-mono font-medium" data-no-translate>{monthlyStats.deliveredGarments}</span> garments handed over
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FETCH ERROR BANNER */}
      {fetchError && !datePickerMode && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          <span>{fetchError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCalendar(currentDate)}
            className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/15"
          >
            Retry
          </Button>
        </div>
      )}

      {/* MAIN CALENDAR + SIDE-BY-SIDE INSPECTOR */}
      <div
        className={
          datePickerMode
            ? "w-full"
            : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        }
      >
        {/* LEFT COLUMN: MONTHLY CALENDAR CARD */}
        <div
          className={
            datePickerMode
              ? "w-full"
              : "lg:col-span-7 xl:col-span-8 rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-5 shadow-sm"
          }
        >
          {/* MONTH NAVIGATION */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <motion.h3
                key={format(currentDate, "yyyy-MM")}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-base md:text-lg text-foreground px-2 min-w-[140px] text-center"
              >
                {format(currentDate, "MMMM yyyy")}
              </motion.h3>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={goToNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={goToToday}
              >
                Today
              </Button>
              {!datePickerMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => fetchCalendar(currentDate)}
                  title="Refresh calendar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {/* CAPACITY & STAGE LEGEND */}
          {!datePickerMode && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60 text-[11px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Near Full
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Over Capacity
                </span>
                <span>🔒 Locked</span>
                <span>🎉 Holiday</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="text-amber-600 dark:text-amber-400">✂️ Cut</span>
                <span className="text-indigo-600 dark:text-indigo-400">🪡 Stitch</span>
                <span className="text-orange-600 dark:text-orange-400">♨️ Iron</span>
                <span className="text-sky-600 dark:text-sky-400">📦 Partial</span>
                <span className="text-emerald-600 dark:text-emerald-400">✓ All Delivered</span>
              </div>
            </div>
          )}

          {/* WEEKDAY HEADERS */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAY_LABELS.map((label, idx) => (
              <div
                key={label}
                className={`text-center text-xs font-bold py-1.5 rounded-lg ${
                  idx >= 5
                    ? "text-primary/80 bg-primary/5"
                    : "text-muted-foreground bg-muted/30"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* CALENDAR GRID */}
          <AnimatePresence mode="wait">
            <motion.div
              key={format(currentDate, "yyyy-MM")}
              initial={{ opacity: 0, x: slideDir === "right" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir === "right" ? -20 : 20 }}
              transition={{ duration: 0.18 }}
            >
              {loading ? (
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        datePickerMode ? "h-16" : "min-h-[92px]"
                      } rounded-xl bg-muted/50 animate-pulse`}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: gridSize }).map((_, idx) => {
                    const dayIndex = idx - startOffset;
                    if (dayIndex < 0 || dayIndex >= daysInMonth) {
                      return (
                        <ProductionCalendarDay
                          key={idx}
                          day={null}
                          onClick={() => {}}
                          compact={datePickerMode}
                        />
                      );
                    }

                    const dateStr = calData?.days[dayIndex]?.date;
                    const daySummary = dateStr ? dayMap.get(dateStr) : undefined;

                    return (
                      <ProductionCalendarDay
                        key={idx}
                        day={daySummary ?? null}
                        onClick={handleDayClick}
                        isSelected={selectedDate === dateStr}
                        compact={datePickerMode}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: INLINE ORDER PROGRESS INSPECTOR (Desktop) */}
        {!datePickerMode && (
          <div className="lg:col-span-5 xl:col-span-4">
            <ProductionDayDetails
              date={selectedDate}
              open={false}
              onClose={() => {}}
              inline={true}
              onStatusUpdated={() => fetchCalendar(currentDate)}
            />
          </div>
        )}
      </div>

      {/* MOBILE / TABLET DAY DETAIL SHEET */}
      {!datePickerMode && (
        <ProductionDayDetails
          date={selectedDate}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          inline={false}
          onStatusUpdated={() => fetchCalendar(currentDate)}
        />
      )}
    </div>
  );
}
