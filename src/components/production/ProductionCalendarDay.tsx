import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { capacityStatusColor } from "@/utils/productionUtils";
import type { DaySummary } from "@/types/productionCalendar";
import { parseISO, isToday } from "date-fns";
import type { CapacityStatus } from "@/utils/productionUtils";

interface Props {
  day: DaySummary | null; // null for days outside current month
  onClick: (day: DaySummary) => void;
  isSelected?: boolean;
  compact?: boolean;
}

/**
 * Single day cell in the Production Calendar.
 * Redesigned for shadcn Dark & Light themes with rich Order & Garment progress indicators.
 */
export default function ProductionCalendarDay({
  day,
  onClick,
  isSelected = false,
  compact = false,
}: Props) {
  // Empty cell for days outside current month
  if (!day) {
    return (
      <div
        className={`${
          compact ? "h-16" : "min-h-[92px]"
        } rounded-xl bg-muted/20 dark:bg-muted/10 border border-transparent`}
      />
    );
  }

  const date = parseISO(day.date);
  const dayNum = date.getDate();
  const isTodayDate = isToday(date);

  const colors =
    capacityStatusColor[day.capacityStatus as CapacityStatus] ??
    capacityStatusColor.GREEN;

  const isWeekend = day.dayOfWeek === 6 || day.dayOfWeek === 7;

  const hasOrders =
    (day.scheduledOrders ?? 0) > 0 || day.scheduledGarments > 0;

  const avgProgress =
    day.averageOrderProgress ??
    (day.scheduledGarments > 0
      ? Math.round(
          (day.completedGarments / day.scheduledGarments) * 100
        )
      : 0);

  // Strict delivery check: only 100% green when ALL orders are delivered
  const allOrdersDelivered =
    (day.scheduledOrders ?? 0) > 0 &&
    day.ordersFullyDelivered === day.scheduledOrders;

  const hasReadyOrPartial = (day.ordersReadyForDelivery ?? 0) > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClick(day)}
              data-no-translate
              className={`
                group relative w-full ${
                  compact ? "h-16 p-1.5" : "min-h-[92px] p-2"
                }
                rounded-xl border text-left transition-all cursor-pointer
                flex flex-col justify-between

                ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                    : "hover:shadow-sm"
                }

                ${
                  day.isBlocked
                    ? "bg-muted/60 dark:bg-slate-900/60 border-border opacity-75"
                    : ""
                }

                ${
                  day.isHoliday && !day.isBlocked
                    ? "bg-purple-50/90 dark:bg-purple-950/35 border-purple-200 dark:border-purple-800/70"
                    : ""
                }

                ${
                  !day.isBlocked && !day.isHoliday
                    ? hasOrders
                      ? `${colors.bg} ${colors.border}`
                      : "bg-card hover:bg-accent/40 border-border/80"
                    : ""
                }

                ${
                  isWeekend &&
                  !day.isBlocked &&
                  !day.isHoliday &&
                  !hasOrders
                    ? "bg-muted/30 dark:bg-muted/15"
                    : ""
                }
              `}
            >
              {/* Top row: Day number + Status Icons */}
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className={`text-xs font-bold rounded-lg w-6 h-6 flex items-center justify-center transition-colors
                    ${
                      isTodayDate
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isSelected
                        ? "bg-primary/15 text-primary font-extrabold"
                        : "text-foreground group-hover:text-primary"
                    }
                  `}
                >
                  {dayNum}
                </span>

                <div className="flex items-center gap-1">
                  {day.isPowerCut && (
                    <span
                      title="Power cut / reduced capacity"
                      className="text-[11px]"
                    >
                      ⚡
                    </span>
                  )}

                  {day.isBlocked && (
                    <span className="text-[11px] opacity-80">🔒</span>
                  )}

                  {day.isHoliday && !day.isBlocked && (
                    <span className="text-[11px]">🎉</span>
                  )}

                  {!day.isBlocked && !day.isHoliday && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasOrders
                          ? colors.dot
                          : "bg-emerald-400/50 dark:bg-emerald-500/40"
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Middle: Order & Garment counts + Mini Stage Pills */}
              {hasOrders ? (
                <div className="mt-1 space-y-1 w-full">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={`text-[11px] font-bold leading-none ${colors.text}`}
                    >
                      {day.scheduledOrders
                        ? `${day.scheduledOrders} Ord`
                        : `${day.scheduledGarments} Pcs`}
                    </span>

                    <span className="text-[10px] font-medium text-muted-foreground leading-none">
                      {day.scheduledGarments} pcs
                    </span>
                  </div>

                  {!compact && (
                    <div className="flex flex-wrap items-center gap-0.5">
                      {(day.ordersInCutting ?? day.cuttingPending ?? 0) > 0 && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          ✂️{day.ordersInCutting ?? day.cuttingPending}
                        </span>
                      )}

                      {(day.ordersInStitching ??
                        day.stitchingPending ??
                        0) > 0 && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                          🪡
                          {day.ordersInStitching ?? day.stitchingPending}
                        </span>
                      )}

                      {(day.ordersInIroning ?? 0) > 0 && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25">
                          ♨️{day.ordersInIroning}
                        </span>
                      )}

                      {hasReadyOrPartial && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25">
                          📦{day.ordersReadyForDelivery}
                        </span>
                      )}

                      {allOrdersDelivered && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-background/70 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        allOrdersDelivered
                          ? "bg-emerald-500"
                          : hasReadyOrPartial
                          ? "bg-sky-500"
                          : avgProgress >= 60
                          ? "bg-teal-500"
                          : avgProgress >= 30
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                      }`}
                      style={{
                        width: `${Math.max(avgProgress, 8)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                !compact && (
                  <div className="mt-auto pt-1">
                    {day.isHoliday ? (
                      <span className="text-[10px] font-medium text-purple-600 dark:text-purple-300 truncate block">
                        {day.holidayName || "Holiday"}
                      </span>
                    ) : day.isBlocked ? (
                      <span className="text-[10px] font-medium text-muted-foreground truncate block">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">
                        Free ({day.effectiveCapacity})
                      </span>
                    )}
                  </div>
                )
              )}
            </motion.button>
          }
        />

        <TooltipContent className="p-3.5 max-w-[250px] text-left space-y-2 bg-popover text-popover-foreground border-border shadow-xl rounded-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
            <p className="font-bold text-xs">
              {date.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>

            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
            >
              {day.scheduledGarments}/{day.effectiveCapacity} cap
            </span>
          </div>

          {day.isBlocked && (
            <p className="text-xs text-destructive font-medium">
              🔒 Blocked
              {day.blockReason ? `: ${day.blockReason}` : ""}
            </p>
          )}

          {day.isHoliday && (
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              🎉 {day.holidayName}
            </p>
          )}

          {day.isPowerCut && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚡ Power cut / reduced capacity
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground">Orders Due:</span>
            <span className="font-semibold text-right">
              {day.scheduledOrders ?? 0}
            </span>

            <span className="text-muted-foreground">Total Garments:</span>
            <span className="font-semibold text-right">
              {day.scheduledGarments}
            </span>

            <span className="text-amber-600 dark:text-amber-400">
              ✂️ Cutting Orders:
            </span>
            <span className="font-semibold text-right">
              {day.ordersInCutting ?? 0}
            </span>

            <span className="text-indigo-600 dark:text-indigo-400">
              🪡 Stitching Orders:
            </span>
            <span className="font-semibold text-right">
              {day.ordersInStitching ?? 0}
            </span>

            <span className="text-orange-600 dark:text-orange-400">
              ♨️ Ironing Orders:
            </span>
            <span className="font-semibold text-right">
              {day.ordersInIroning ?? 0}
            </span>

            <span className="text-teal-600 dark:text-teal-400">
              ✅ Ready / Partial:
            </span>
            <span className="font-semibold text-right">
              {day.ordersReadyForDelivery ?? 0}
            </span>

            <span className="text-emerald-600 dark:text-emerald-400">
              🎉 Fully Delivered:
            </span>
            <span className="font-semibold text-right">
              {day.ordersFullyDelivered ?? 0}
            </span>
          </div>

          {hasOrders && (
            <div className="pt-1 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                Avg Order Progress
              </span>
              <span className="font-bold text-primary">
                {avgProgress}%
              </span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}