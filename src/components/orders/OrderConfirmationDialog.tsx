import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Printer,
  Download,
  Eye,
  PlusCircle,
  Layers,
  Sparkles,
  FileText,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type InvoiceData,
  type PrintPaperFormat,
  getInvoiceSettings,
  printInvoice,
  downloadInvoicePdf,
} from "@/services/invoiceService";

interface OrderConfirmationDialogProps {
  open: boolean;
  invoice: InvoiceData | null;
  onClose: () => void;
  onNewOrder?: () => void;
}

export function OrderConfirmationDialog({
  open,
  invoice,
  onClose,
  onNewOrder,
}: OrderConfirmationDialogProps) {
  const navigate = useNavigate();
  const [format, setFormat] = useState<PrintPaperFormat>(() => getInvoiceSettings().defaultPaperFormat || "A4");
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!open || !invoice) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printInvoice(invoice, { format });
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice, { format });
    } finally {
      setDownloading(false);
    }
  };

  const handleViewOrder = () => {
    onClose();
    navigate(`/orders/${invoice.orderId}`);
  };

  const handleCreateAnother = () => {
    onClose();
    if (onNewOrder) {
      onNewOrder();
    } else {
      navigate("/orders/new");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden">
        {/* TOP ACCENT DECORATION */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* HEADER / CELEBRATION */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
              <span>Order Confirmed!</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Order <strong className="text-foreground">#{invoice.orderId}</strong> has been successfully booked
            </p>
          </div>
        </div>

        {/* ORDER DETAILS SUMMARY CARD */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {/* CUSTOMER & SAMPLE BOOK */}
          <div className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Customer
              </p>
              <p className="font-bold text-foreground text-base mt-0.5">
                {invoice.customerName}
              </p>
              {invoice.customerPhone && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  📞 {invoice.customerPhone}
                </p>
              )}
            </div>

            <div className="text-right">
              {invoice.sampleBookPageNumber && (
                <Badge variant="outline" className="text-xs font-semibold">
                  Book #{invoice.sampleBookPageNumber}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mt-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{invoice.garments.length} {invoice.garments.length === 1 ? "Garment" : "Garments"}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* FINANCIAL SUMMARY ROW */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-background/80 rounded-lg p-2 border border-border/50">
              <p className="text-[11px] text-muted-foreground uppercase font-medium">Grand Total</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ₹{invoice.grandTotal.toFixed(2)}
              </p>
            </div>

            <div className="bg-background/80 rounded-lg p-2 border border-border/50">
              <p className="text-[11px] text-muted-foreground uppercase font-medium">Paid</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{invoice.totalPaid.toFixed(2)}
              </p>
            </div>

            <div className="bg-background/80 rounded-lg p-2 border border-border/50">
              <p className="text-[11px] text-muted-foreground uppercase font-medium">Balance Due</p>
              <p className={`text-sm font-bold mt-0.5 ${invoice.balanceDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                ₹{invoice.balanceDue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* PAPER FORMAT SELECTOR */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Printer Machine Format</span>
            <span className="text-[11px] font-medium text-foreground">
              {format === "A4" ? "📄 A4 Full Sheet" : "🧾 3-Inch POS Roll"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => setFormat("A4")}
              className={[
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                format === "A4"
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>A4 Full Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("THERMAL_3INCH")}
              className={[
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                format === "THERMAL_3INCH"
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span>3" Thermal Roll</span>
            </button>
          </div>
        </div>

        {/* PRIMARY INVOICE ACTIONS */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="gap-2 h-11 bg-primary text-primary-foreground font-semibold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? "Preparing Print..." : "Print Invoice"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-2 h-11 border-border font-semibold hover:bg-accent cursor-pointer"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>{downloading ? "Downloading..." : "Download PDF"}</span>
            </Button>
          </div>

          {/* SECONDARY NAVIGATION */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleViewOrder}
              className="gap-1.5 h-10 text-xs font-semibold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Order Details</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleCreateAnother}
              className="gap-1.5 h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Another Order</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
