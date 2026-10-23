import React, { useEffect, useState } from "react";
import type { DashboardSummary } from "@/types/billingModule";
import { getBillingDashboardSummary } from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  CreditCard,
  Scissors,
  Layers,
  AlertCircle,
  FileText,
  PlusCircle,
  RefreshCw,
  Wallet,
  IndianRupee,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";

interface BillingDashboardTabProps {
  onNavigateTab: (tab: string) => void;
}

export const BillingDashboardTab: React.FC<BillingDashboardTabProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardSummary | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getBillingDashboardSummary();
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-slate-400 text-sm">Loading billing metrics...</p>
      </div>
    );
  }

  const s = data || {
    todaySales: 0,
    todayTaxable: 0,
    todayGst: 0,
    todayInvoicesCount: 0,
    monthTurnover: 0,
    monthTaxable: 0,
    monthGst: 0,
    monthInvoicesCount: 0,
    monthCancelledCount: 0,
    fabricSales: 0,
    stitchingSales: 0,
    mixedSales: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    pendingAmount: 0,
    dailySalesChart: [],
    monthlySalesChart: [],
    paymentDistribution: [],
  };

  const fabricPercent = s.monthTurnover > 0 ? Math.round((s.fabricSales / s.monthTurnover) * 100) : 0;
  const stitchingPercent = s.monthTurnover > 0 ? Math.round((s.stitchingSales / s.monthTurnover) * 100) : 0;
  const otherPercent = Math.max(0, 100 - fabricPercent - stitchingPercent);

  // max value for daily chart scaling
  const maxDaily = Math.max(...s.dailySalesChart.map((d) => d.value), 1000);
  const maxMonthly = Math.max(...s.monthlySalesChart.map((m) => m.value), 5000);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Billing & Tax Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enterprise invoicing, GST compliance, fabric accounting & tax reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => onNavigateTab("generate")}
            className="font-bold shadow-sm flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Generate Bill
          </Button>

          <Button
            onClick={() => onNavigateTab("custom")}
            variant="outline"
            className="font-medium flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Manual Invoice
          </Button>

          <Button
            onClick={loadData}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Sales */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Today's Sales
              <IndianRupee className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">₹{s.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Taxable: <span className="text-foreground font-medium">₹{s.todayTaxable.toFixed(2)}</span>
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              {s.todayInvoicesCount} invoices generated
            </p>
          </CardContent>
        </Card>

        {/* Monthly Billing */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Monthly Turnover
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">₹{s.monthTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Taxable: <span className="text-foreground font-medium">₹{s.monthTaxable.toFixed(2)}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {s.monthInvoicesCount} Active • {s.monthCancelledCount} Cancelled
            </p>
          </CardContent>
        </Card>

        {/* GST Collected */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              GST Collected
              <Receipt className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{s.monthGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Today's GST: <span className="text-foreground font-medium">₹{s.todayGst.toFixed(2)}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              CGST + SGST / IGST Total
            </p>
          </CardContent>
        </Card>

        {/* Fabric Sales */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Fabric Revenue
              <Layers className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">₹{s.fabricSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Share: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{fabricPercent}%</span> of month
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Shop-provided fabrics</p>
          </CardContent>
        </Card>

        {/* Stitching Sales */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Stitching Revenue
              <Scissors className="w-4 h-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">₹{s.stitchingSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Share: <span className="text-purple-600 dark:text-purple-400 font-bold">{stitchingPercent}%</span> of month
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tailoring & Add-ons</p>
          </CardContent>
        </Card>

        {/* Outstanding / Pending */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Total Outstanding
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">₹{s.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Collected: <span className="text-emerald-600 dark:text-emerald-400 font-medium">₹{s.totalPaid.toFixed(2)}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Unsettled customer balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Mix & Distribution Bar */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>Monthly Revenue Composition (Fabric vs. Stitching)</span>
            <span className="text-xs text-muted-foreground font-normal">Total: ₹{s.monthTurnover.toFixed(2)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full bg-muted h-4 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${fabricPercent}%` }}
              className="bg-indigo-500 h-full transition-all"
              title={`Fabric: ₹${s.fabricSales.toFixed(2)} (${fabricPercent}%)`}
            />
            <div
              style={{ width: `${stitchingPercent}%` }}
              className="bg-purple-500 h-full transition-all"
              title={`Stitching: ₹${s.stitchingSales.toFixed(2)} (${stitchingPercent}%)`}
            />
            <div
              style={{ width: `${otherPercent}%` }}
              className="bg-primary h-full transition-all"
              title={`Mixed/Other: ₹${s.mixedSales.toFixed(2)} (${otherPercent}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-muted-foreground font-medium">Fabric Sales:</span>
              <span className="text-foreground font-bold">₹{s.fabricSales.toFixed(2)} ({fabricPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground font-medium">Stitching Services:</span>
              <span className="text-foreground font-bold">₹{s.stitchingSales.toFixed(2)} ({stitchingPercent}%)</span>
            </div>
            {s.mixedSales > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground font-medium">Mixed / Custom:</span>
                <span className="text-foreground font-bold">₹{s.mixedSales.toFixed(2)} ({otherPercent}%)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visual Trends: Daily & Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Sales Trend */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Daily Sales Trend (Last 14 Days)</span>
              <span className="text-xs text-muted-foreground">Daily Revenue</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Overview of daily customer billing volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.dailySalesChart.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                No recent invoice data
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-1 pt-6 px-1 border-b border-border">
                {s.dailySalesChart.map((d, idx) => {
                  const heightPercent = Math.min(100, Math.max(8, (d.value / maxDaily) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-8 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] py-1 px-1.5 rounded shadow-lg border border-border whitespace-nowrap z-10">
                        <span>{d.label}</span>
                        <span className="font-bold text-primary">₹{d.value.toFixed(0)}</span>
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[18px] rounded-t transition-all ${
                          d.value > 0 ? "bg-primary/80 group-hover:bg-primary" : "bg-muted"
                        }`}
                      />
                      <span className="text-[9px] text-muted-foreground transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                        {d.label.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6-Month Turnover Trend */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Monthly Turnover Trend (Last 6 Months)</span>
              <span className="text-xs text-muted-foreground">Turnover vs Taxable</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Financial growth trajectory and taxable sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.monthlySalesChart.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                No historical invoice data
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-4 pt-6 px-4 border-b border-border">
                {s.monthlySalesChart.map((m, idx) => {
                  const heightPercent = Math.min(100, Math.max(10, (m.value / maxMonthly) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded shadow-lg border border-border whitespace-nowrap z-10">
                        <span className="font-semibold">{m.label}</span>
                        <span className="text-primary font-bold">Total: ₹{m.value.toFixed(0)}</span>
                        {m.secondaryValue && <span className="text-muted-foreground">Taxable: ₹{m.secondaryValue.toFixed(0)}</span>}
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-emerald-600 dark:bg-emerald-500 rounded-t group-hover:opacity-90 transition-all shadow-sm"
                      />
                      <span className="text-[10px] text-muted-foreground font-medium mt-2">
                        {m.label.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Distribution & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <Card className="border-border bg-card md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Payment Collection Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Breakdown of customer payment channels this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.paymentDistribution.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No recorded payments for this month
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {s.paymentDistribution.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/40 rounded-lg border border-border flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>{p.method}</span>
                      <span className="text-[10px]">{p.count} txns</span>
                    </div>
                    <div className="text-base font-bold text-foreground mt-2">
                      ₹{p.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shortcut Modules Card */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Module Navigation
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Jump straight to billing tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              onClick={() => onNavigateTab("invoices")}
              className="w-full justify-start text-xs"
            >
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Invoice Register & History
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab("fabrics")}
              className="w-full justify-start text-xs"
            >
              <Layers className="w-4 h-4 mr-2 text-indigo-500" />
              Fabric Inventory Master
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab("consumption")}
              className="w-full justify-start text-xs"
            >
              <Scissors className="w-4 h-4 mr-2 text-purple-500" />
              Fabric Consumption Formulas
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab("reports")}
              className="w-full justify-start text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
              Monthly GST & CA Reports
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab("settings")}
              className="w-full justify-start text-xs"
            >
              <Wallet className="w-4 h-4 mr-2 text-amber-500" />
              Billing Switches & Tax Rules
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
