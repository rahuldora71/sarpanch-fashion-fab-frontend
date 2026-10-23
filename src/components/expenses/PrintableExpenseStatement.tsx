import React from "react";
import { Printer, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExpenseSummaryResponse } from "@/types/expense";

interface PrintableExpenseStatementProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ExpenseSummaryResponse | null;
  startDate: string;
  endDate: string;
  categoryFilter?: string;
}

export const PrintableExpenseStatement: React.FC<PrintableExpenseStatementProps> = ({
  isOpen,
  onClose,
  summary,
  startDate,
  endDate,
  categoryFilter,
}) => {
  if (!isOpen || !summary) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = summary.totalAmount ?? 0;
  const recurringAmount = summary.recurringAmount ?? 0;
  const oneTimeAmount = summary.oneTimeAmount ?? 0;
  const count = summary.count ?? 0;
  const expenses = summary.expenses ?? [];
  const categoryBreakdowns = summary.categoryBreakdowns ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-background text-foreground border border-border rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-3 sm:p-4 border-b border-border bg-muted/40 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Printable Expense Statement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 rounded-xl gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Sheet Content */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #expense-print-area, #expense-print-area * {
                visibility: visible;
              }
              #expense-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 15mm;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          <div id="expense-print-area" className="space-y-6 text-black">
            {/* Shop Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                  SARPANCH FASHION FAB
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  Bespoke Tailoring, Designer Fabrics & Custom Menswear
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Near Main Market, Opp. Bus Stand • GSTIN: Available on Request
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-slate-900 text-white rounded">
                  EXPENSE STATEMENT
                </span>
                <p className="text-xs text-slate-600 mt-1.5 font-medium">
                  Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Statement Metadata */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Statement Period:</span>
                <span className="font-bold text-slate-900">
                  {startDate} to {endDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Total Transactions:</span>
                <span className="font-bold text-slate-900">{count} Records</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Filtered Category:</span>
                <span className="font-bold text-slate-900">{categoryFilter || "All Categories"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Net Total Expenditure:</span>
                <span className="font-extrabold text-base text-slate-950">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Top Summaries Split */}
            <div className="grid grid-cols-3 gap-3 text-xs border border-slate-200 rounded-lg p-3">
              <div>
                <span className="text-slate-500 font-medium block">Monthly Recurring Overheads</span>
                <span className="font-bold text-sm text-slate-900">
                  ₹{recurringAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {totalAmount > 0 ? ((recurringAmount / totalAmount) * 100).toFixed(1) : 0}% of total
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Variable / One-Time Spend</span>
                <span className="font-bold text-sm text-slate-900">
                  ₹{oneTimeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {totalAmount > 0 ? ((oneTimeAmount / totalAmount) * 100).toFixed(1) : 0}% of total
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Daily Average Spend</span>
                <span className="font-bold text-sm text-slate-900">
                  ₹{summary.dailyAverage?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "0.00"}
                </span>
                <span className="text-[10px] text-slate-500 block">Per day during period</span>
              </div>
            </div>

            {/* Category Breakdown Table */}
            {categoryBreakdowns.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Category Breakdown
                </h4>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-left">Category Name</th>
                      <th className="p-2 text-center">Transactions</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                      <th className="p-2 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categoryBreakdowns.map((cat) => (
                      <tr key={cat.category}>
                        <td className="p-2 font-medium">{cat.categoryLabel}</td>
                        <td className="p-2 text-center">{cat.count}</td>
                        <td className="p-2 text-right font-bold">
                          ₹{cat.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-medium">{cat.percentageOfTotal}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Itemized Transactions Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Itemized Expense Register
              </h4>
              <table className="w-full text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Voucher #</th>
                    <th className="p-2 text-left">Category & Purpose</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Paid To</th>
                    <th className="p-2 text-left">Mode</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-2 whitespace-nowrap">{exp.expenseDate}</td>
                      <td className="p-2 font-mono whitespace-nowrap">{exp.expenseNumber}</td>
                      <td className="p-2">
                        <span className="font-semibold">{exp.description}</span>
                        <span className="text-[10px] text-slate-500 block">{exp.category}</span>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {exp.isRecurring ? "Monthly (Fixed)" : "One-Time"}
                      </td>
                      <td className="p-2">{exp.paidTo || "—"}</td>
                      <td className="p-2">{exp.paymentMethod || "CASH"}</td>
                      <td className="p-2 text-right font-bold whitespace-nowrap">
                        ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-900">
                  <tr>
                    <td colSpan={6} className="p-2 text-right uppercase">
                      Grand Total:
                    </td>
                    <td className="p-2 text-right">
                      ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature Block */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-xs">
              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="font-bold text-slate-900">Shop Master / Authorized Signatory</p>
                <p className="text-slate-500 text-[10px]">Sarpanch Fashion Fab</p>
              </div>
              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="font-bold text-slate-900">Accountant / Auditor / CA Review</p>
                <p className="text-slate-500 text-[10px]">Accounts & Tax Verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
