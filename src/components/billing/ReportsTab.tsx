import React, { useState, useEffect } from "react";
import type { MonthlyReport, CaExport } from "@/types/billingModule";
import {
  getMonthlyBillingReport,
  getCaExportReport,
  closeBillingMonth,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Download,
  Lock,
  RefreshCw,
  Building,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

export const ReportsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"monthly" | "ca">("monthly");

  // Monthly Report States
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [isClosingMonth, setIsClosingMonth] = useState<boolean>(false);

  // CA Export States
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    now.toISOString().split("T")[0]
  );
  const [caData, setCaData] = useState<CaExport | null>(null);
  const [loadingCa, setLoadingCa] = useState<boolean>(false);

  // Fetch Monthly Report
  const fetchMonthly = async () => {
    try {
      setLoadingMonthly(true);
      const res = await getMonthlyBillingReport(selectedMonth, selectedYear);
      setMonthlyData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load monthly report");
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Fetch CA Export
  const fetchCaExport = async () => {
    try {
      setLoadingCa(true);
      const res = await getCaExportReport(startDate, endDate);
      setCaData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load CA report");
    } finally {
      setLoadingCa(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "monthly") {
      fetchMonthly();
    } else {
      fetchCaExport();
    }
  }, [activeSubTab, selectedMonth, selectedYear]);

  // Handle Month Closing
  const handleCloseMonth = async () => {
    const note = prompt(`Enter optional closing remarks for month ${selectedMonth}/${selectedYear}:`, closingNotes);
    if (note === null) return;
    setClosingNotes(note);

    try {
      setIsClosingMonth(true);
      await closeBillingMonth({
        month: selectedMonth,
        year: selectedYear,
        notes: note.trim() || undefined,
      });
      toast.success(`Month ${selectedMonth}/${selectedYear} has been closed and locked!`);
      fetchMonthly();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to close month");
    } finally {
      setIsClosingMonth(false);
    }
  };

  // Export CSV Helper
  const downloadCsv = () => {
    if (!caData) return;

    let csv = "Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Type,Taxable Value,CGST,SGST,IGST,Total Tax,Grand Total\n";

    const allInvoices = [...caData.b2bInvoices, ...caData.b2cInvoices];
    allInvoices.forEach((inv) => {
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.customerName}","${inv.customerGstin || "-"}","${inv.invoiceType}",${inv.taxableAmount.toFixed(2)},${inv.cgstAmount.toFixed(2)},${inv.sgstAmount.toFixed(2)},${inv.igstAmount.toFixed(2)},${inv.totalTax.toFixed(2)},${inv.grandTotal.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GST_CA_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Switcher */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                GST & Turnover Reports (Accountant / CA Ready)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Generate monthly GST summaries, HSN/SAC analyses, and exports for filing GSTR-1 & 3B.
              </CardDescription>
            </div>

            <div className="flex bg-muted rounded-lg p-1 border border-border">
              <button
                type="button"
                onClick={() => setActiveSubTab("monthly")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "monthly" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly GST & Turnover
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("ca")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "ca" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                CA Export (B2B vs B2C)
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* MONTHLY REPORT SUB-TAB */}
      {activeSubTab === "monthly" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger className="bg-background border-input text-xs text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-28">
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="bg-background border-input text-xs text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchMonthly}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingMonthly ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseMonth}
                  disabled={isClosingMonth}
                  className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Close & Freeze Month
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly KPI Overview */}
          {monthlyData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase">Gross Monthly Turnover</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    ₹{monthlyData.totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {monthlyData.invoiceCount} Valid Invoices • {monthlyData.cancelledCount} Cancelled
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase">Total Taxable Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-primary">
                    ₹{monthlyData.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">GSTR-1 Base Value</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase">Total GST Output Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-blue-500">
                    ₹{monthlyData.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Total Tax Liability</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase">CGST / SGST / IGST Split</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST:</span>
                    <span className="font-mono font-bold text-foreground">₹{monthlyData.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST:</span>
                    <span className="font-mono font-bold text-foreground">₹{monthlyData.sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IGST:</span>
                    <span className="font-mono font-bold text-foreground">₹{monthlyData.igstAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HSN / SAC Summary Table */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-foreground">
                HSN / SAC Summary (GSTR-1 Table 12 Compliance)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground">
                      <th className="py-3 px-4">HSN / SAC Code</th>
                      <th className="py-3 px-3 text-right">Total Quantity</th>
                      <th className="py-3 px-3 text-center">GST Rate</th>
                      <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                      <th className="py-3 px-3 text-right">CGST (₹)</th>
                      <th className="py-3 px-3 text-right">SGST (₹)</th>
                      <th className="py-3 px-3 text-right">IGST (₹)</th>
                      <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {monthlyData?.hsnSummary.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No HSN / SAC records found for this period.
                        </td>
                      </tr>
                    ) : (
                      monthlyData?.hsnSummary.map((hsn, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {hsn.hsnSacCode}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                            {hsn.totalQuantity.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-blue-500">
                            {hsn.gstRate}%
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-foreground">
                            ₹{hsn.taxableAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                            ₹{hsn.cgstAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                            ₹{hsn.sgstAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                            ₹{hsn.igstAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            ₹{hsn.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CA EXPORT SUB-TAB */}
      {activeSubTab === "ca" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">From:</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 bg-background border-input text-xs text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">To:</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 bg-background border-input text-xs text-foreground"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchCaExport}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingCa ? "animate-spin" : ""}`} />
                  Filter Range
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={downloadCsv}
                  disabled={!caData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV for CA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CA B2B vs B2C Split Cards */}
          {caData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2B Invoices */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-500" />
                      B2B Invoices (Customers with GSTIN)
                    </span>
                    <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                      {caData.b2bInvoicesCount} Invoices
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Turnover:</span>
                    <span className="font-mono font-bold text-foreground">₹{caData.b2bTaxable.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Tax Liability:</span>
                    <span className="font-mono font-bold text-blue-500">₹{caData.b2bTax.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground italic pt-2">
                    Eligible for input tax credit (ITC) pass-through on GSTR-1 Table 4.
                  </div>
                </CardContent>
              </Card>

              {/* B2C Invoices */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      B2C Invoices (Retail Walk-in Customers)
                    </span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                      {caData.b2cInvoicesCount} Invoices
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Turnover:</span>
                    <span className="font-mono font-bold text-foreground">₹{caData.b2cTaxable.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Tax Liability:</span>
                    <span className="font-mono font-bold text-emerald-500">₹{caData.b2cTax.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground italic pt-2">
                    Reported as aggregated B2C small supplies on GSTR-1 Table 7.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
