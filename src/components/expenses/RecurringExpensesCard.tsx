import React, { useState } from "react";
import {
  Repeat,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Zap,
  Scissors,
  Coffee,
  Wifi,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RecurringExpenseItem, RecurringExpenseScheduleResponse } from "@/types/expense";

interface RecurringExpensesCardProps {
  schedule: RecurringExpenseScheduleResponse | null;
  onAddNewRecurring: () => void;
  onQuickLog: (item: RecurringExpenseItem) => void;
  isLoading?: boolean;
}

export const RecurringExpensesCard: React.FC<RecurringExpensesCardProps> = ({
  schedule,
  onAddNewRecurring,
  onQuickLog,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

  const currentMonthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const items = schedule?.items ?? [];
  const displayedItems = filterPendingOnly
    ? items.filter((i) => !i.loggedForCurrentMonth)
    : items;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SHOP_RENT":
        return <Building2 className="w-4 h-4 text-rose-500" />;
      case "ELECTRICITY_BILL":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "SEWING_SUPPLIES":
        return <Scissors className="w-4 h-4 text-blue-500" />;
      case "TEA_REFRESHMENTS":
        return <Coffee className="w-4 h-4 text-orange-500" />;
      case "INTERNET_PHONE":
        return <Wifi className="w-4 h-4 text-cyan-500" />;
      case "SALARY_ADVANCE":
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Repeat className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className={`bg-card text-card-foreground border border-border rounded-2xl shadow-xs overflow-hidden ${isLoading ? "opacity-75" : ""}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Monthly Recurring Expenses & Overheads
              </h2>
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800">
                Happens Every Month
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fixed recurring shop expenses tracked for <span className="font-semibold text-foreground">{currentMonthName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`text-xs h-8 rounded-xl ${
              filterPendingOnly ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300" : ""
            }`}
          >
            {filterPendingOnly ? "Showing Pending Only" : "Show Pending Only"}
          </Button>

          <Button
            size="sm"
            onClick={onAddNewRecurring}
            className="text-xs h-8 rounded-xl gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Monthly Overhead</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 rounded-xl text-muted-foreground"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Progress Bar & Summary Bar */}
      <div className="px-4 sm:px-5 py-3 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-muted-foreground">Monthly Budget: </span>
            <span className="font-bold text-foreground">
              ₹{(schedule?.totalMonthlyBudget ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <div>
            <span className="text-muted-foreground">Paid for {currentMonthName}: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ₹{(schedule?.loggedAmountThisMonth ?? 0).toLocaleString("en-IN")} ({schedule?.loggedCountThisMonth ?? 0}/{schedule?.totalRecurringCount ?? 0})
            </span>
          </div>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <div>
            <span className="text-muted-foreground">Pending to Pay: </span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              ₹{(schedule?.pendingAmountThisMonth ?? 0).toLocaleString("en-IN")} ({schedule?.pendingCountThisMonth ?? 0} bills)
            </span>
          </div>
        </div>

        {schedule && schedule.totalMonthlyBudget > 0 && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((schedule.loggedAmountThisMonth || 0) / schedule.totalMonthlyBudget) * 100
                    )
                  )}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-foreground shrink-0">
              {Math.min(
                100,
                Math.round(
                  ((schedule.loggedAmountThisMonth || 0) / schedule.totalMonthlyBudget) * 100
                )
              )}%
            </span>
          </div>
        )}
      </div>

      {/* Item List */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {displayedItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              {filterPendingOnly ? (
                <div className="flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span className="font-semibold text-foreground">Awesome! All monthly overheads have been paid and logged for this month.</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Repeat className="w-8 h-8 text-muted-foreground/40" />
                  <p>No recurring monthly overheads configured yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddNewRecurring}
                    className="mt-2 text-xs rounded-xl"
                  >
                    Add Shop Rent, Electricity, or Maintenance
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                    item.loggedForCurrentMonth
                      ? "bg-emerald-500/[0.03] border-emerald-500/25 dark:border-emerald-500/20"
                      : "bg-card border-border hover:border-purple-300 dark:hover:border-purple-800"
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-foreground line-clamp-1">
                            {item.description}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span>{item.categoryLabel}</span>
                            {item.recurringDayOfMonth && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-foreground">
                                  Due: Day {item.recurringDayOfMonth}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {item.loggedForCurrentMonth ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Logged</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-[10px] gap-1 shrink-0">
                          <AlertCircle className="w-3 h-3" />
                          <span>Due</span>
                        </Badge>
                      )}
                    </div>

                    {/* Middle details */}
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-border/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Monthly Amount</span>
                        <div className="text-sm font-bold text-foreground">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </div>
                      </div>

                      {item.paidTo && (
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground">Paid To</span>
                          <div className="text-xs font-medium text-foreground line-clamp-1">
                            {item.paidTo}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-3 pt-2.5 border-t border-border/40">
                    {item.loggedForCurrentMonth ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
                        <span>✓ Recorded for this month</span>
                        <span className="text-muted-foreground text-[10px]">{item.lastLoggedDate}</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onQuickLog(item)}
                        className="w-full h-7 text-xs rounded-lg gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      >
                        <Check className="w-3 h-3" />
                        <span>Log for This Month (1-Click)</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
