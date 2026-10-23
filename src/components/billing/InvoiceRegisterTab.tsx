import React, { useState, useEffect } from "react";
import type { Invoice, PageResponse } from "@/types/billingModule";
import {
  getInvoices,
  recordInvoicePayment,
  cancelInvoice,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CreditCard,
  Ban,
  RefreshCw,
  FileText,
  Eye,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceRegisterTabProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoiceRegisterTab: React.FC<InvoiceRegisterTabProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [page, setPage] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [classificationFilter, setClassificationFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");

  // Payment Recording Modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);

  // Cancellation Modal
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res: PageResponse<Invoice> = await getInvoices({
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        classification: classificationFilter !== "ALL" ? classificationFilter : undefined,
        paymentStatus: paymentStatusFilter !== "ALL" ? paymentStatusFilter : undefined,
        page,
        size: 15,
      });
      setInvoices(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, classificationFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchInvoices();
  };

  // Open Payment Dialog
  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(inv.balanceAmount || 0);
    setPaymentMethod("CASH");
    setPaymentRef("");
    setPaymentNotes("");
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }

    try {
      setIsRecordingPayment(true);
      await recordInvoicePayment(selectedInvoiceForPayment.id, {
        amount: paymentAmount,
        paymentMethod,
        transactionReference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      toast.success(`Payment of ₹${paymentAmount} recorded successfully!`);
      setSelectedInvoiceForPayment(null);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Open Cancel Dialog
  const handleOpenCancel = (inv: Invoice) => {
    setSelectedInvoiceForCancel(inv);
    setCancelReason("");
  };

  // Submit Cancellation
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForCancel) return;

    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancelling this invoice.");
      return;
    }

    try {
      setIsCancelling(true);
      await cancelInvoice(selectedInvoiceForCancel.id, {
        reason: cancelReason.trim(),
      });
      toast.success(`Invoice ${selectedInvoiceForCancel.invoiceNumber} has been voided/cancelled.`);
      setSelectedInvoiceForCancel(null);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel invoice");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (inv: Invoice) => {
    if (inv.isCancelled) {
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-300 border-rose-500/30">
          CANCELLED
        </Badge>
      );
    }

    switch (inv.paymentStatus) {
      case "PAID":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">PAID</Badge>;
      case "PARTIALLY_PAID":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">PARTIAL</Badge>;
      default:
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">UNPAID</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Invoice Register & Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                View, reprint, collect payments, and manage immutable tax invoices.
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchInvoices}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Refresh Register"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search Invoice No, Customer, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-background border-input text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                <SelectTrigger className="bg-background border-input text-xs text-foreground">
                  <SelectValue placeholder="Invoice Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="PAID">Fully Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={paymentStatusFilter} onValueChange={(val) => setPaymentStatusFilter(val || "ALL")}>
                <SelectTrigger className="bg-background border-input text-xs text-foreground">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="ALL">All Payment Statuses</SelectItem>
                  <SelectItem value="PAID">Fully Paid</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={classificationFilter} onValueChange={(val) => setClassificationFilter(val || "ALL")}>
                <SelectTrigger className="bg-background border-input text-xs text-foreground">
                  <SelectValue placeholder="Classification" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="ALL">All Classifications</SelectItem>
                  <SelectItem value="STITCHING_ONLY">Stitching Only</SelectItem>
                  <SelectItem value="FABRIC_ONLY">Fabric Only</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Apply Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">GST (₹)</th>
                  <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        Loading invoice records...
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted-foreground">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        inv.isCancelled ? "opacity-60 bg-destructive/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground">{inv.customerName}</p>
                        {inv.customerPhone && (
                          <p className="text-[10px] text-muted-foreground font-mono">{inv.customerPhone}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-muted-foreground font-medium">
                        {inv.invoiceType.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-muted-foreground">
                        {inv.classification.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-foreground">
                        ₹{inv.taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-primary font-medium">
                        ₹{inv.totalTax.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={inv.balanceAmount > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                          ₹{inv.balanceAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(inv)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewInvoice(inv)}
                            className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-muted"
                            title="Print / View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>

                          {!inv.isCancelled && inv.balanceAmount > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenPayment(inv)}
                              className="h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-muted"
                              title="Record Collection"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay
                            </Button>
                          )}

                          {!inv.isCancelled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenCancel(inv)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-muted"
                              title="Cancel / Void Invoice"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground">
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={!!selectedInvoiceForPayment} onOpenChange={() => setSelectedInvoiceForPayment(null)}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Record Collection / Payment
            </DialogTitle>
          </DialogHeader>

          {selectedInvoiceForPayment && (
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="font-mono font-bold text-primary">{selectedInvoiceForPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-foreground">{selectedInvoiceForPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-destructive">₹{selectedInvoiceForPayment.balanceAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Payment Amount (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="bg-background border-input font-mono text-sm mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "CASH")}>
                  <SelectTrigger className="bg-background border-input text-xs text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI / QR Code</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Transaction Reference / UTR</Label>
                <Input
                  placeholder="e.g. UPI Ref ID / Cheque No"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Notes</Label>
                <Input
                  placeholder="Optional remarks"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRecordingPayment}
                >
                  {isRecordingPayment ? "Recording..." : "Confirm Payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={!!selectedInvoiceForCancel} onOpenChange={() => setSelectedInvoiceForCancel(null)}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Void / Cancel Invoice
            </DialogTitle>
          </DialogHeader>

          {selectedInvoiceForCancel && (
            <form onSubmit={handleSubmitCancel} className="space-y-4 pt-2">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-destructive">
                  Are you sure you want to cancel invoice {selectedInvoiceForCancel.invoiceNumber}?
                </p>
                <p className="text-muted-foreground text-[11px]">
                  This action marks the invoice as void for tax audits. Linked orders will be released so they can be re-billed.
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Cancellation Reason *</Label>
                <Input
                  required
                  placeholder="e.g. Order altered by customer / Wrong tax rate entered"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoiceForCancel(null)}
                >
                  Keep Invoice
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Confirm Void"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
