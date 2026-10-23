import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from "date-fns";
import {
  Receipt,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getRecurringExpensesSchedule,
  logRecurringExpenseInstance,
} from "@/services/expenseService";
import type {
  Expense,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpenseSummaryResponse,
  RecurringExpenseScheduleResponse,
  RecurringExpenseItem,
} from "@/types/expense";
import { ExpenseKPIs } from "@/components/expenses/ExpenseKPIs";
import { RecurringExpensesCard } from "@/components/expenses/RecurringExpensesCard";
import { ExpenseFilterBar, type DatePreset } from "@/components/expenses/ExpenseFilterBar";
import { ExpenseCategoryChart } from "@/components/expenses/ExpenseCategoryChart";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { PrintableExpenseStatement } from "@/components/expenses/PrintableExpenseStatement";

export default function ExpensesPage() {
  // Preset & Date State
  const [datePreset, setDatePreset] = useState<DatePreset>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>(() => {
    return format(startOfMonth(new Date()), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return format(endOfMonth(new Date()), "yyyy-MM-dd");
  });

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [recurringFilter, setRecurringFilter] = useState<"ALL" | "RECURRING" | "ONE_TIME">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data State
  const [summary, setSummary] = useState<ExpenseSummaryResponse | null>(null);
  const [recurringSchedule, setRecurringSchedule] = useState<RecurringExpenseScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialog & Modal State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDefaultRecurringForm, setIsDefaultRecurringForm] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Handle Preset Changes
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case "TODAY": {
        const todayStr = format(now, "yyyy-MM-dd");
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case "THIS_WEEK": {
        setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        break;
      }
      case "THIS_MONTH": {
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      }
      case "LAST_MONTH": {
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      }
      case "LAST_30_DAYS": {
        setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
        setEndDate(format(now, "yyyy-MM-dd"));
        break;
      }
      case "THIS_YEAR": {
        setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
        break;
      }
      case "CUSTOM":
      default:
        break;
    }
  };

  // Fetch Summary & Expenses
  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const recurringParam =
        recurringFilter === "RECURRING" ? true : recurringFilter === "ONE_TIME" ? false : undefined;

      const data = await getExpenses({
        startDate,
        endDate,
        category: selectedCategory || undefined,
        recurring: recurringParam,
      });
      setSummary(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedCategory, recurringFilter]);

  // Fetch Recurring Schedule
  const loadRecurringSchedule = useCallback(async () => {
    try {
      const schedule = await getRecurringExpensesSchedule();
      setRecurringSchedule(schedule);
    } catch (err: any) {
      console.error("Failed to load recurring overheads schedule", err);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadRecurringSchedule();
  }, [loadRecurringSchedule]);

  // Client-Side Search Filter on Expenses
  const filteredExpenses = useMemo(() => {
    const list = summary?.expenses ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (exp) =>
        exp.description?.toLowerCase().includes(q) ||
        exp.expenseNumber?.toLowerCase().includes(q) ||
        exp.paidTo?.toLowerCase().includes(q) ||
        exp.category?.toLowerCase().includes(q) ||
        exp.notes?.toLowerCase().includes(q)
    );
  }, [summary?.expenses, searchQuery]);

  // Handlers for Add/Edit
  const handleOpenAdd = (recurringDefault = false) => {
    setEditingExpense(null);
    setIsDefaultRecurringForm(recurringDefault);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDefaultRecurringForm(expense.isRecurring);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async (payload: ExpenseCreateRequest | ExpenseUpdateRequest) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, payload as ExpenseUpdateRequest);
      toast.success("Expense updated successfully!");
    } else {
      await createExpense(payload as ExpenseCreateRequest);
      toast.success("Expense recorded successfully!");
    }
    loadExpenses();
    loadRecurringSchedule();
  };

  // Delete Handler
  const handleDelete = async (expense: Expense) => {
    const confirm = window.confirm(
      `Are you sure you want to delete expense "${expense.description}" (₹${expense.amount})?`
    );
    if (!confirm) return;

    try {
      await deleteExpense(expense.id);
      toast.success("Expense deleted successfully!");
      loadExpenses();
      loadRecurringSchedule();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete expense");
    }
  };

  // Quick Log Monthly Recurring Overhead
  const handleQuickLog = async (item: RecurringExpenseItem) => {
    try {
      await logRecurringExpenseInstance(item.id);
      toast.success(`Logged ₹${item.amount} for "${item.description}"!`);
      loadExpenses();
      loadRecurringSchedule();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to quick-log recurring expense");
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory("");
    setRecurringFilter("ALL");
    setSearchQuery("");
    handlePresetChange("THIS_MONTH");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 md:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Shop Expenses & Overheads
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Track daily expenses, monthly recurring bills, and date-range registers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadExpenses();
              loadRecurringSchedule();
            }}
            className="text-xs h-9 rounded-xl gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenAdd(false)}
            className="text-xs h-9 rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Top Analytical KPIs */}
      <ExpenseKPIs
        summary={summary}
        recurringSchedule={recurringSchedule}
        isLoading={isLoading}
      />

      {/* Monthly Recurring Expenses Tracker Card */}
      <RecurringExpensesCard
        schedule={recurringSchedule}
        onAddNewRecurring={() => handleOpenAdd(true)}
        onQuickLog={handleQuickLog}
        isLoading={isLoading}
      />

      {/* Date Range & Filter Bar */}
      <ExpenseFilterBar
        preset={datePreset}
        onPresetChange={handlePresetChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        recurringFilter={recurringFilter}
        onRecurringFilterChange={setRecurringFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onOpenAddExpense={() => handleOpenAdd(false)}
        onOpenPrintStatement={() => setIsPrintModalOpen(true)}
        onResetFilters={handleResetFilters}
      />

      {/* Category Breakdown Progress/Chart */}
      {summary && summary.categoryBreakdowns?.length > 0 && (
        <ExpenseCategoryChart
          breakdowns={summary.categoryBreakdowns}
          totalAmount={summary.totalAmount}
        />
      )}

      {/* Expense History Table */}
      <ExpenseTable
        expenses={filteredExpenses}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Add / Edit Expense Dialog */}
      <ExpenseFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingExpense}
        defaultRecurring={isDefaultRecurringForm}
      />

      {/* Printable Statement Modal */}
      <PrintableExpenseStatement
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        summary={summary}
        startDate={startDate}
        endDate={endDate}
        categoryFilter={selectedCategory}
      />
    </div>
  );
}
