import React, { useState } from "react";
import { PieChart, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExpenseCategorySummary } from "@/types/expense";
import { EXPENSE_CATEGORIES } from "@/types/expense";

interface ExpenseCategoryChartProps {
  breakdowns: ExpenseCategorySummary[];
  totalAmount: number;
}

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  breakdowns,
  totalAmount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!breakdowns || breakdowns.length === 0 || totalAmount <= 0) {
    return null;
  }

  const getCategoryColor = (catValue: string) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.value === catValue);
    if (!found) return "bg-primary";
    switch (catValue) {
      case "SHOP_RENT":
        return "bg-rose-500";
      case "ELECTRICITY_BILL":
        return "bg-amber-500";
      case "SEWING_SUPPLIES":
        return "bg-blue-500";
      case "MACHINE_MAINTENANCE":
        return "bg-emerald-500";
      case "TEA_REFRESHMENTS":
        return "bg-orange-500";
      case "SALARY_ADVANCE":
        return "bg-purple-500";
      case "CLEANING_MAINTENANCE":
        return "bg-teal-500";
      case "INTERNET_PHONE":
        return "bg-cyan-500";
      case "MARKETING_PACKAGING":
        return "bg-pink-500";
      case "TRANSPORT_COURIER":
        return "bg-indigo-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Expense Category Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">
              Proportional distribution of expenses in selected period
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 rounded-xl text-muted-foreground"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3">
          {/* Multi-segment stacked bar */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
            {breakdowns.map((cat) => (
              <div
                key={cat.category}
                className={`${getCategoryColor(cat.category)} h-3 transition-all`}
                style={{ width: `${cat.percentageOfTotal}%` }}
                title={`${cat.categoryLabel}: ₹${cat.totalAmount.toLocaleString("en-IN")} (${cat.percentageOfTotal}%)`}
              />
            ))}
          </div>

          {/* Grid of category items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {breakdowns.map((cat) => {
              const meta = EXPENSE_CATEGORIES.find((c) => c.value === cat.category);
              return (
                <div
                  key={cat.category}
                  className="border border-border/80 bg-muted/20 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${getCategoryColor(cat.category)}`} />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {cat.categoryLabel}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {cat.count} transactions • {meta?.labelHindi || ""}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-foreground">
                      ₹{cat.totalAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {cat.percentageOfTotal}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
