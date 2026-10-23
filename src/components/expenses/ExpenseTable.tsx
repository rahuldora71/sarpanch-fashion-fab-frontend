import React, { useState } from "react";
import {
  Repeat,
  ShoppingBag,
  Pencil,
  Trash2,
  FileImage,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Receipt,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "@/types/expense";
import { EXPENSE_CATEGORIES } from "@/types/expense";

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isLoading?: boolean;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"date" | "amount" | "category">("date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const getCategoryMeta = (categoryVal: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === categoryVal);
  };

  const getPaymentMethodBadge = (method?: string) => {
    switch (method) {
      case "UPI":
        return <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-800">UPI</Badge>;
      case "CASH":
        return <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800">CASH</Badge>;
      case "BANK_TRANSFER":
        return <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-300 dark:border-purple-800">BANK</Badge>;
      case "CARD":
        return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-800">CARD</Badge>;
      case "CHEQUE":
        return <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-300 dark:border-indigo-800">CHEQUE</Badge>;
      default:
        return method ? <Badge variant="outline" className="text-[10px]">{method}</Badge> : null;
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortField === "date") {
      const diff = new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
      return sortAsc ? -diff : diff;
    }
    if (sortField === "amount") {
      return sortAsc ? a.amount - b.amount : b.amount - a.amount;
    }
    if (sortField === "category") {
      return sortAsc
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    }
    return 0;
  });

  const toggleSort = (field: "date" | "amount" | "category") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className={`bg-card text-card-foreground border border-border rounded-2xl shadow-xs overflow-hidden ${isLoading ? "opacity-75" : ""}`}>
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Expense Transactions ({expenses.length})</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detailed log of all recorded expenditures for the period
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No expenses found for this selection.</p>
          <p className="text-xs mt-1">Try adjusting your date range or filters, or add a new expense.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] border-b border-border tracking-wider">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Voucher</span>
                      {sortField === "date" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Category & Description</span>
                      {sortField === "category" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Paid To & Method</th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount</span>
                      {sortField === "amount" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Receipt</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedExpenses.map((exp) => {
                  const meta = getCategoryMeta(exp.category);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Date & Voucher */}
                      <td className="p-3.5 align-middle">
                        <div className="font-semibold text-foreground">
                          {exp.expenseDate}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {exp.expenseNumber}
                        </div>
                      </td>

                      {/* Category & Description */}
                      <td className="p-3.5 align-middle max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              meta?.color || "bg-muted text-foreground border-border"
                            }`}
                          >
                            {meta?.label || exp.category}
                          </span>
                        </div>
                        <div className="font-medium text-foreground line-clamp-1">
                          {exp.description}
                        </div>
                        {exp.notes && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Type (Recurring vs One-time) */}
                      <td className="p-3.5 align-middle whitespace-nowrap">
                        {exp.isRecurring ? (
                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 text-[10px] gap-1 font-semibold">
                            <Repeat className="w-3 h-3" />
                            <span>Monthly{exp.recurringDayOfMonth ? ` (Day ${exp.recurringDayOfMonth})` : ""}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>One-Time</span>
                          </Badge>
                        )}
                      </td>

                      {/* Paid To & Method */}
                      <td className="p-3.5 align-middle whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {exp.paidTo || "—"}
                        </div>
                        <div className="mt-0.5">
                          {getPaymentMethodBadge(exp.paymentMethod)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 align-middle text-right whitespace-nowrap">
                        <div className="text-sm font-extrabold text-foreground">
                          ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Receipt */}
                      <td className="p-3.5 align-middle text-center">
                        {exp.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(exp.receiptUrl || null)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border hover:bg-muted text-primary cursor-pointer transition-colors"
                            title="View receipt image"
                          >
                            <FileImage className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(exp)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Edit expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(exp)}
                            className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="md:hidden divide-y divide-border">
            {sortedExpenses.map((exp) => {
              const meta = getCategoryMeta(exp.category);
              return (
                <div key={exp.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            meta?.color || "bg-muted text-foreground border-border"
                          }`}
                        >
                          {meta?.label || exp.category}
                        </span>
                        {exp.isRecurring && (
                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 text-[10px] gap-1 font-semibold">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>Monthly</span>
                          </Badge>
                        )}
                      </div>
                      <div className="font-semibold text-xs text-foreground mt-1.5">
                        {exp.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {exp.expenseDate} • {exp.expenseNumber}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-foreground">
                        ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="mt-0.5">
                        {getPaymentMethodBadge(exp.paymentMethod)}
                      </div>
                    </div>
                  </div>

                  {/* Footer with PaidTo, Receipt & Actions */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                    <div className="text-[11px] text-muted-foreground">
                      {exp.paidTo && <span>To: <strong className="text-foreground">{exp.paidTo}</strong></span>}
                    </div>

                    <div className="flex items-center gap-1">
                      {exp.receiptUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReceipt(exp.receiptUrl || null)}
                          className="h-7 text-xs rounded-lg text-primary gap-1"
                        >
                          <FileImage className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(exp)}
                        className="h-7 w-7 rounded-lg text-muted-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(exp)}
                        className="h-7 w-7 rounded-lg text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Lightbox / Modal for Receipt Viewer */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-card rounded-2xl border border-border overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Expense Bill / Receipt</span>
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={selectedReceipt}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                  title="Open full image in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/20">
              <img
                src={selectedReceipt}
                alt="Expense Receipt"
                className="max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
