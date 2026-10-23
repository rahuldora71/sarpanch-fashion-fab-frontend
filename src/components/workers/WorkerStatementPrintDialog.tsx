import { useRef, useState } from "react";
import { format } from "date-fns";
import {
  Printer,
  Download,
  X,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import type { WorkerStatementData } from "@/types/workerStatement";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface WorkerStatementPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementData: WorkerStatementData | null;
  amountPaid?: number;
  paymentMode?: string;
  settlementNote?: string;
  settlementNumber?: string;
}

export function WorkerStatementPrintDialog({
  open,
  onOpenChange,
  statementData,
  amountPaid,
  paymentMode = "CASH",
  settlementNote,
  settlementNumber,
}: WorkerStatementPrintDialogProps) {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!open || !statementData) return null;

  const {
    worker,
    cycleLabel,
    startDate,
    endDate,
    settlementDate,
    garmentsSummary,
    totalGarmentsCount,
    grossEarnings,
    advancesList,
    totalAdvances,
    previousBalance,
    netPayable,
  } = statementData;

  const actualAmountPaid = amountPaid !== undefined ? amountPaid : netPayable;
  const remainingBalance = Math.round((netPayable - actualAmountPaid) * 100) / 100;
  const slipId = settlementNumber || `STMT-${format(new Date(), "yyyyMMdd")}-${worker.id}`;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printContentRef.current) return;
    setDownloadingPdf(true);
    try {
      const element = printContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeWorkerName = worker.name.replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Worker_Statement_${safeWorkerName}_${slipId}.pdf`);
      toast.success("Statement PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Could not download PDF. You can use Print -> Save as PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* PRINT-SPECIFIC CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #worker-statement-printable,
          #worker-statement-printable * {
            visibility: visible !important;
          }
          #worker-statement-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* MODAL WRAPPER */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* HEADER BAR (NO PRINT) */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              📜
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                Statement Receipt (हिसाब पर्ची)
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {worker.name} &bull; {cycleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="gap-1 sm:gap-1.5 rounded-xl text-xs font-bold h-8 sm:h-9 px-2 sm:px-3"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>{downloadingPdf ? "Generating..." : "PDF"}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleBrowserPrint}
              className="gap-1 sm:gap-1.5 rounded-xl text-xs font-bold shadow-xs h-8 sm:h-9 px-2.5 sm:px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTAINER (SCROLLABLE ON SCREEN, CLEAN ON PRINT) */}
        <div className="overflow-y-auto p-2 sm:p-4 md:p-8 bg-muted/20">
          <div
            id="worker-statement-printable"
            ref={printContentRef}
            className="max-w-[780px] mx-auto bg-white text-gray-900 p-4 sm:p-6 md:p-8 rounded-xl shadow-xs border border-gray-200 font-sans"
            style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          >
            {/* 1. SHOP HEADER */}
            <div className="border-b-2 border-gray-900 pb-4 mb-5 text-center">
              <div className="inline-block bg-gray-900 text-white px-3 py-1 rounded-md text-xs font-extrabold tracking-widest uppercase mb-1">
                Workshop Tailor Statement & Payout Slip
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-950 uppercase">
                SARPANCH FASHION FAB
              </h1>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Bespoke Tailoring, Designer Wear & Alteration Studio
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Contact: +91 98765 43210 &bull; Shop No. 12, Main Market &bull; GSTIN: Unregistered Workshop
              </p>
            </div>

            {/* 2. RECEIPT META + WORKER DETAILS */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 text-xs mb-5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Worker Information / कारीगर विवरण
                </p>
                <p className="text-base font-extrabold text-gray-900">{worker.name}</p>
                <p className="text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-500" />
                  <strong>Phone:</strong> {worker.phone}
                </p>
                <p className="text-gray-600">
                  <strong>Specialty:</strong> {worker.workerSpecialty || "Stitching Tailor"}
                </p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Settlement Details / हिसाब विवरण
                </p>
                <p className="font-extrabold text-gray-900">
                  Slip No: <span className="font-mono text-xs">{slipId}</span>
                </p>
                <p className="text-gray-700 font-semibold">
                  <strong>Cycle:</strong> {cycleLabel}
                </p>
                <p className="text-gray-600">
                  <strong>Period:</strong> {format(new Date(startDate), "dd/MM/yyyy")} to{" "}
                  {format(new Date(endDate), "dd/MM/yyyy")}
                </p>
                <p className="text-gray-600">
                  <strong>Payment Date:</strong>{" "}
                  {format(new Date(settlementDate || new Date()), "dd MMMM yyyy")}
                </p>
              </div>
            </div>

            {/* 3. TABLE A: GARMENTS MADE SUMMARY (सिले गए कपड़े) */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  1. Garments Stitched / सिले गए कपड़े
                </h3>
                <span className="text-[11px] font-bold text-gray-600">
                  Total Completed: <strong>{totalGarmentsCount} Pcs</strong>
                </span>
              </div>

              <table className="w-full text-xs border border-gray-200 border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 text-left border-b border-gray-200 font-bold">
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3">Garment Item / Service</th>
                    <th className="py-2 px-3 text-center">Quantity (Pcs)</th>
                    <th className="py-2 px-3 text-right">Base Rate (₹)</th>
                    <th className="py-2 px-3 text-right">Add-ons (₹)</th>
                    <th className="py-2 px-3 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {garmentsSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-gray-400 italic">
                        No garments marked ready in this cycle
                      </td>
                    </tr>
                  ) : (
                    garmentsSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-1.5 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-gray-900">
                          {item.serviceName}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold text-gray-800">
                          {item.count}
                        </td>
                        <td className="py-1.5 px-3 text-right text-gray-700">
                          ₹{item.rate.toLocaleString("en-IN")}
                        </td>
                        <td className="py-1.5 px-3 text-right text-amber-700 font-semibold">
                          {item.addOnsAmount > 0
                            ? `+₹${item.addOnsAmount.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="py-1.5 px-3 text-right font-extrabold text-gray-950">
                          ₹{item.totalAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-extrabold border-t-2 border-gray-300 text-gray-900">
                    <td colSpan={2} className="py-2 px-3 uppercase tracking-wide">
                      Gross Work Done Total (A)
                    </td>
                    <td className="py-2 px-3 text-center text-emerald-700">
                      {totalGarmentsCount} Pcs
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 font-normal">
                      ₹{statementData.baseGarmentsEarnings.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-700 font-bold">
                      +₹{statementData.totalAddOnsCommission.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-3 text-right text-sm text-emerald-800">
                      ₹{grossEarnings.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 3B. TABLE A2: ADD-ON WORK & EMBELLISHMENTS (if any) */}
            {statementData.addOnsSummary && statementData.addOnsSummary.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    1.B Add-on Work & Embellishments / अतिरिक्त कार्य व ऐड-ऑन
                  </h3>
                  <span className="text-[11px] font-bold text-amber-800">
                    Total Add-on Commission: <strong>+₹{statementData.totalAddOnsCommission.toLocaleString("en-IN")}</strong>
                  </span>
                </div>

                <table className="w-full text-xs border border-gray-200 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 text-left border-b border-gray-200 font-bold">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">Add-on Item / Work</th>
                      <th className="py-2 px-3 text-center">Units</th>
                      <th className="py-2 px-3 text-right">Commission / Unit (₹)</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statementData.addOnsSummary.map((ao, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-1.5 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-gray-900">
                          {ao.name}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold text-gray-800">
                          {ao.count}
                        </td>
                        <td className="py-1.5 px-3 text-right text-gray-700">
                          ₹{ao.rate.toLocaleString("en-IN")}
                        </td>
                        <td className="py-1.5 px-3 text-right font-extrabold text-amber-800">
                          +₹{ao.totalAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. TABLE B: ADVANCES & DAILY KHARCHA (काटा गया एडवांस व खर्चा) */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  2. Advances & Daily Kharcha Deducted / काटा गया दैनिक खर्चा व एडवांस
                </h3>
                <span className="text-[11px] font-bold text-gray-600">
                  Total Deductions: <strong>₹{totalAdvances.toLocaleString("en-IN")}</strong>
                </span>
              </div>

              <table className="w-full text-xs border border-gray-200 border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 text-left border-b border-gray-200 font-bold">
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3 w-28">Date</th>
                    <th className="py-2 px-3">Description / Note</th>
                    <th className="py-2 px-3 text-center w-20">Mode</th>
                    <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {advancesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-400 italic">
                        No advances or daily kharcha taken during this period
                      </td>
                    </tr>
                  ) : (
                    advancesList.map((adv, idx) => (
                      <tr key={adv.id} className="hover:bg-gray-50/50">
                        <td className="py-1.5 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-gray-700">
                          {format(new Date(adv.advanceDate), "dd MMM yyyy")}
                        </td>
                        <td className="py-1.5 px-3 text-gray-800">
                          <span className="font-semibold">
                            {adv.type === "DAILY_KHARCHA"
                              ? "दैनिक खर्चा"
                              : adv.type === "ADVANCE"
                              ? "एडवांस / पेशगी"
                              : adv.type}
                          </span>
                          {adv.note && (
                            <span className="text-gray-500 ml-1.5">({adv.note})</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-center text-gray-600 font-mono text-[11px]">
                          {adv.paymentMode}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-rose-700">
                          -₹{Number(adv.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-extrabold border-t-2 border-gray-300 text-gray-900">
                    <td colSpan={4} className="py-2 px-3 uppercase tracking-wide">
                      Total Advances Deducted (B)
                    </td>
                    <td className="py-2 px-3 text-right text-rose-700 text-sm">
                      -₹{totalAdvances.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. FINAL SETTLEMENT HISAB SUMMARY BOX */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border-2 border-gray-900 rounded-lg p-4 mb-6">
              <div className="space-y-1.5 text-xs">
                <p className="font-extrabold uppercase tracking-wide text-gray-900 mb-2 border-b border-gray-200 pb-1">
                  Settlement Calculation / हिसाब गणना
                </p>
                <div className="flex justify-between text-gray-700">
                  <span>Base Garments Stitching:</span>
                  <span className="font-semibold text-gray-800">
                    +₹{statementData.baseGarmentsEarnings.toLocaleString("en-IN")}
                  </span>
                </div>
                {statementData.totalAddOnsCommission > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Add-on Work Commission:</span>
                    <span className="font-semibold text-amber-700">
                      +₹{statementData.totalAddOnsCommission.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1">
                  <span>Gross Earnings (A):</span>
                  <span>+₹{grossEarnings.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Previous Balance (बकाया/एडवांस):</span>
                  <span
                    className={`font-bold ${
                      previousBalance >= 0 ? "text-gray-900" : "text-rose-600"
                    }`}
                  >
                    {previousBalance >= 0 ? "+" : ""}₹{previousBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Less: Total Advances (B):</span>
                  <span className="font-bold text-rose-700">
                    -₹{totalAdvances.toLocaleString("en-IN")}
                  </span>
                </div>
                {settlementNote && (
                  <p className="text-[11px] text-gray-500 italic pt-1">
                    Note: {settlementNote}
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-300 md:pl-4 pt-3 md:pt-0">
                <div className="space-y-1 text-right">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Net Amount Payable / शुद्ध देय राशि
                  </p>
                  <p
                    className={`text-2xl font-black ${
                      netPayable >= 0 ? "text-emerald-800" : "text-rose-700"
                    }`}
                  >
                    ₹{netPayable.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    {netPayable > 0
                      ? "Payable to worker (कारीगर को देय)"
                      : netPayable < 0
                      ? "Excess advance taken (कारीगर पर बकाया)"
                      : "Fully settled (हिसाब चुकता)"}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Amount Paid Now ({paymentMode}):</span>
                    <span className="text-emerald-700">
                      ₹{actualAmountPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>Balance Carried Forward:</span>
                    <span className="font-bold text-gray-900">
                      ₹{remainingBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. SIGNATURE LINES */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-dashed border-gray-400 pt-2">
                <p className="font-extrabold text-gray-900">{worker.name}</p>
                <p className="text-[11px] text-gray-500">
                  Worker Signature / कारीगर हस्ताक्षर
                </p>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2">
                <p className="font-extrabold text-gray-900">SARPANCH FASHION FAB</p>
                <p className="text-[11px] text-gray-500">
                  Authorized Signatory & Seal / अधिकृत हस्ताक्षर
                </p>
              </div>
            </div>

            {/* FOOTER TIMESTAMP */}
            <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
              Printed on {format(new Date(), "dd MMM yyyy, hh:mm a")} &bull; Generated from Tailor ERP Workshop Portal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
