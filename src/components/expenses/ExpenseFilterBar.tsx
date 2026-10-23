import React from "react";
import {
  Search,
  Filter,
  X,
  Printer,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXPENSE_CATEGORIES } from "@/types/expense";

export type DatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "LAST_30_DAYS" | "THIS_YEAR" | "CUSTOM";

interface ExpenseFilterBarProps {
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  recurringFilter: "ALL" | "RECURRING" | "ONE_TIME";
  onRecurringFilterChange: (val: "ALL" | "RECURRING" | "ONE_TIME") => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onOpenAddExpense: () => void;
  onOpenPrintStatement: () => void;
  onResetFilters: () => void;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedCategory,
  onCategoryChange,
  recurringFilter,
  onRecurringFilterChange,
  searchQuery,
  onSearchQueryChange,
  onOpenAddExpense,
  onOpenPrintStatement,
  onResetFilters,
}) => {
  const PRESET_BUTTONS: { id: DatePreset; label: string }[] = [
    { id: "TODAY", label: "Today" },
    { id: "THIS_WEEK", label: "This Week" },
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_MONTH", label: "Last Month" },
    { id: "LAST_30_DAYS", label: "Last 30 Days" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Action Row: Title / Quick Add & Print Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Expense History & Range Filters</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filter, search and track expenses across any custom time period
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-8 sm:h-9 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
            title="Reset to default filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPrintStatement}
            className="text-xs h-8 sm:h-9 rounded-xl gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement / PDF</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenAddExpense}
            className="text-xs h-8 sm:h-9 rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* Date Presets Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {PRESET_BUTTONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all border ${
              preset === p.id
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date Range Inputs & Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 items-end">
        {/* Start Date */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            From Date (आरंभ)
          </label>
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                onPresetChange("CUSTOM");
              }}
              className="text-xs h-8 sm:h-9 rounded-xl pr-2"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            To Date (समाप्ति)
          </label>
          <div className="relative">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                onEndDateChange(e.target.value);
                onPresetChange("CUSTOM");
              }}
              className="text-xs h-8 sm:h-9 rounded-xl pr-2"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Category (श्रेणी)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs h-8 sm:h-9 rounded-xl border border-input bg-background text-foreground px-2.5 focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories (सभी श्रेणियां)</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} ({cat.labelHindi})
              </option>
            ))}
          </select>
        </div>

        {/* Type / Recurrence Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Expense Type
          </label>
          <select
            value={recurringFilter}
            onChange={(e) => onRecurringFilterChange(e.target.value as "ALL" | "RECURRING" | "ONE_TIME")}
            className="w-full text-xs h-8 sm:h-9 rounded-xl border border-input bg-background text-foreground px-2.5 focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Types</option>
            <option value="RECURRING">🔁 Monthly Recurring Only</option>
            <option value="ONE_TIME">📦 One-Time Only</option>
          </select>
        </div>

        {/* Search Query */}
        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Search Keyword
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search description, recipient, voucher #..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="text-xs h-8 sm:h-9 rounded-xl pl-8 pr-7"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
