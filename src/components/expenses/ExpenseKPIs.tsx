import React from "react";
import {
  IndianRupee,
  Repeat,
  ShoppingBag,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import type { ExpenseSummaryResponse, RecurringExpenseScheduleResponse } from "@/types/expense";

interface ExpenseKPIsProps {
  summary: ExpenseSummaryResponse | null;
  recurringSchedule: RecurringExpenseScheduleResponse | null;
  isLoading?: boolean;
}

export const ExpenseKPIs: React.FC<ExpenseKPIsProps> = ({
  summary,
  recurringSchedule,
  isLoading,
}) => {
  const totalAmount = summary?.totalAmount ?? 0;
  const recurringAmount = summary?.recurringAmount ?? 0;
  const oneTimeAmount = summary?.oneTimeAmount ?? 0;
  const count = summary?.count ?? 0;
  const dailyAverage = summary?.dailyAverage ?? 0;

  const recurringPct = totalAmount > 0 ? ((recurringAmount / totalAmount) * 100).toFixed(0) : "0";
  const oneTimePct = totalAmount > 0 ? ((oneTimeAmount / totalAmount) * 100).toFixed(0) : "0";

  const totalMonthlyBudget = recurringSchedule?.totalMonthlyBudget ?? 0;
  const loggedThisMonth = recurringSchedule?.loggedAmountThisMonth ?? 0;
  const pendingThisMonth = recurringSchedule?.pendingAmountThisMonth ?? 0;
  const pendingCount = recurringSchedule?.pendingCountThisMonth ?? 0;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${isLoading ? "opacity-75" : ""}`}>
      {/* 1. Total Expenses in Range */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Spent (कुल खर्च)
          </span>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IndianRupee className="size-4" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span><strong className="text-foreground font-semibold">{count}</strong> txns</span>
            <span>•</span>
            <span>Avg <strong className="text-foreground font-semibold">₹{dailyAverage.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>/day</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Recurring Overheads */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Monthly Recurring (मासिक)
          </span>
          <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Repeat className="size-4" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            ₹{recurringAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="inline-block px-1.5 py-0.2 rounded font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px]">
              {recurringPct}%
            </span>
            <span>Fixed shop overheads</span>
          </div>
        </div>
      </div>

      {/* 3. One-Time / Variable Expenses */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Variable (परिवर्तनीय)
          </span>
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-4" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            ₹{oneTimeAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="inline-block px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
              {oneTimePct}%
            </span>
            <span>Petty, supplies & repairs</span>
          </div>
        </div>
      </div>

      {/* 4. Current Month Overhead Status */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            This Month (बजट)
          </span>
          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
            pendingCount === 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}>
            {pendingCount === 0 ? <CalendarCheck className="size-4" /> : <AlertCircle className="size-4" />}
          </div>
        </div>
        <div className="mt-1.5">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
            <span>₹{loggedThisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span className="text-xs text-muted-foreground font-normal">
              / ₹{totalMonthlyBudget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="text-[11px] mt-0.5">
            {pendingCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✓ All monthly overheads paid
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 truncate">
                ⚠ {pendingCount} bills pending (₹{pendingThisMonth.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
