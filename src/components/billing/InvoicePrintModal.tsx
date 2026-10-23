import React, { useState } from "react";
import type { Invoice, BillingConfig } from "@/types/billingModule";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, FileText, Receipt } from "lucide-react";

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  config: BillingConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  config,
  isOpen,
  onClose,
}) => {
  const [template, setTemplate] = useState<"A4" | "THERMAL">("A4");

  if (!invoice) return null;

  const shopName = config?.shopName || "Sarpanch Fashion Fab";
  const shopTagline = config?.tagline || "Custom Tailoring & Designer Fabrics";
  const shopGstin = config?.gstin || "08AAAAA0000A1Z5";
  const shopAddress = config?.address || "Main Market, Jaipur, Rajasthan";
  const shopPhone = config?.phone || "+91 98765 43210";
  const shopUpi = config?.upiId || "sarpanchfab@upi";
  const bankName = config?.bankName || "State Bank of India";
  const accountNumber = config?.accountNumber || "398712345678";
  const ifscCode = config?.ifscCode || "SBIN0001234";
  const terms = invoice.termsAndConditions || config?.termsAndConditions || "Goods once sold will not be exchanged without invoice.";

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num: number): string => {
    const a = [
      "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
      "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const n = Math.round(num);
    if (n === 0) return "Zero Rupees Only";

    const inWords = (n: number): string => {
      let str = "";
      if (n > 9999999) {
        str += inWords(Math.floor(n / 10000000)) + "Crore ";
        n %= 10000000;
      }
      if (n > 99999) {
        str += inWords(Math.floor(n / 100000)) + "Lakh ";
        n %= 100000;
      }
      if (n > 999) {
        str += inWords(Math.floor(n / 1000)) + "Thousand ";
        n %= 1000;
      }
      if (n > 99) {
        str += inWords(Math.floor(n / 100)) + "Hundred ";
        n %= 100;
      }
      if (n > 0) {
        if (str !== "") str += "and ";
        if (n < 20) str += a[n];
        else {
          str += b[Math.floor(n / 10)];
          if (n % 10 > 0) str += " " + a[n % 10];
        }
      }
      return str;
    };

    return inWords(n) + "Rupees Only";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-background border-border text-foreground print:bg-white print:text-black print:max-w-none print:border-none print:m-0 print:p-0">
        {/* Top Action Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/60 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-foreground">Invoice Preview</span>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono">
              {invoice.invoiceNumber}
            </Badge>
            {invoice.isCancelled && (
              <Badge variant="destructive">
                CANCELLED / VOID
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5 border border-border mr-2">
              <button
                type="button"
                onClick={() => setTemplate("A4")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                  template === "A4" ? "bg-background text-foreground font-bold shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                A4 Standard
              </button>
              <button
                type="button"
                onClick={() => setTemplate("THERMAL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
                  template === "THERMAL" ? "bg-background text-foreground font-bold shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                80mm Thermal
              </button>
            </div>

            <Button
              onClick={handlePrint}
              size="sm"
              className="font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* PRINT CONTENT CONTAINER */}
        <div className="p-6 md:p-8 flex justify-center print:p-0">
          {template === "A4" ? (
            /* =========================================================
               A4 TAX INVOICE TEMPLATE (GST COMPLIANT)
            ========================================================= */
            <div
              id="printable-invoice"
              className="w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-sm p-8 print:shadow-none print:p-6 print:w-full print:max-w-none text-xs border border-slate-200"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Invoice Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3.5">
                    <img
                      src="/brand/logo-badge.png"
                      alt="Sarpanch Fashion Fab"
                      className="w-16 h-16 object-contain rounded-full border border-slate-200 flex-shrink-0 bg-white"
                    />
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">{shopName}</h1>
                      <p className="text-xs text-amber-700 font-semibold tracking-wide uppercase mt-0.5">{shopTagline}</p>
                      <p className="text-xs text-slate-600 mt-1 max-w-sm">{shopAddress}</p>
                      <p className="text-xs text-slate-600">
                        Phone: <span className="font-semibold text-slate-800">{shopPhone}</span>
                      </p>
                      <p className="text-xs text-slate-700 mt-1">
                        GSTIN: <span className="font-mono font-bold text-slate-900">{shopGstin}</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        State: <span className="font-semibold text-slate-800">{config?.state || "Rajasthan"} (Code: {config?.stateCode || "08"})</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-slate-950 text-white font-bold px-3 py-1 rounded text-xs tracking-wider uppercase mb-2">
                      {invoice.invoiceType.replace(/_/g, " ")}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Invoice No:</p>
                      <p className="text-base font-black font-mono text-slate-950">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Date:</p>
                      <p className="text-xs font-semibold text-slate-800">{invoice.invoiceDate}</p>
                      {invoice.dueDate && (
                        <p className="text-xs text-slate-500">
                          Due: <span className="font-medium text-slate-700">{invoice.dueDate}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Place of Supply: <span className="font-semibold text-slate-800">{invoice.placeOfSupply}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To & Details Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3 rounded border border-slate-200 mb-4">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Billed To (Customer)</h3>
                  <p className="text-sm font-bold text-slate-950">{invoice.customerName}</p>
                  {invoice.customerPhone && (
                    <p className="text-xs text-slate-600 mt-0.5">Phone: <span className="font-medium text-slate-900">{invoice.customerPhone}</span></p>
                  )}
                  {invoice.customerAddress && (
                    <p className="text-xs text-slate-600 mt-0.5">{invoice.customerAddress}</p>
                  )}
                  {invoice.customerGstin ? (
                    <p className="text-xs text-slate-700 mt-1 font-mono">
                      GSTIN: <span className="font-bold text-slate-950">{invoice.customerGstin}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Customer Type: Unregistered (B2C)</p>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Billing Overview</h3>
                    <p className="text-xs text-slate-600">
                      Classification: <span className="font-semibold text-slate-900">{invoice.classification.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Pricing: <span className="font-semibold text-slate-900">{invoice.isTaxInclusive ? "Tax Inclusive" : "Tax Exclusive"}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Supply: <span className="font-semibold text-slate-900">{invoice.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}</span>
                    </p>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded ${
                      invoice.paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : invoice.paymentStatus === "PARTIALLY_PAID"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}>
                      Payment: {invoice.paymentStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-4 overflow-hidden rounded border border-slate-300">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2 px-2.5 w-8 text-center">#</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2 w-20 text-center">HSN/SAC</th>
                      <th className="py-2 px-2 w-14 text-right">Qty</th>
                      <th className="py-2 px-2 w-16 text-right">Rate</th>
                      <th className="py-2 px-2 w-20 text-right">Taxable</th>
                      <th className="py-2 px-2 w-14 text-center">GST %</th>
                      <th className="py-2 px-2.5 w-24 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="py-2 px-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-2.5">
                          <p className="font-semibold text-slate-900">{item.description}</p>
                          <span className="text-[10px] text-slate-500 uppercase">{item.itemType}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-700">{item.hsnSacCode || "-"}</td>
                        <td className="py-2 px-2 text-right font-medium text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-slate-800">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900">₹{item.taxableAmount.toFixed(2)}</td>
                        <td className="py-2 px-2 text-center text-slate-700">{item.gstRate}%</td>
                        <td className="py-2 px-2.5 text-right font-bold text-slate-950">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Breakdown & Totals */}
              <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Left: GST Split Box & Amount in Words */}
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">GST Tax Analysis</h4>
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-500">
                          <th className="pb-1">Component</th>
                          <th className="pb-1 text-center">Rate</th>
                          <th className="pb-1 text-right">Tax Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {invoice.isInterState ? (
                          <tr>
                            <td className="py-1 font-medium">IGST</td>
                            <td className="py-1 text-center">As configured</td>
                            <td className="py-1 text-right font-semibold text-slate-900">₹{invoice.igstAmount.toFixed(2)}</td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td className="py-1 font-medium">Central GST (CGST)</td>
                              <td className="py-1 text-center">Half rate</td>
                              <td className="py-1 text-right font-semibold text-slate-900">₹{invoice.cgstAmount.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-medium">State GST (SGST)</td>
                              <td className="py-1 text-center">Half rate</td>
                              <td className="py-1 text-right font-semibold text-slate-900">₹{invoice.sgstAmount.toFixed(2)}</td>
                            </tr>
                          </>
                        )}
                        <tr className="font-bold border-t border-slate-300 text-slate-900">
                          <td className="pt-1">Total Tax (GST)</td>
                          <td></td>
                          <td className="pt-1 text-right">₹{invoice.totalTax.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount in Words:</p>
                    <p className="text-xs font-semibold text-slate-900 italic capitalize mt-0.5">
                      {numberToWords(invoice.grandTotal)}
                    </p>
                  </div>
                </div>

                {/* Right: Calculations Summary */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-slate-800">₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  {invoice.isInterState ? (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span className="font-semibold text-slate-800">₹{invoice.igstAmount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST:</span>
                        <span className="font-semibold text-slate-800">₹{invoice.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST:</span>
                        <span className="font-semibold text-slate-800">₹{invoice.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Round-off:</span>
                      <span className="font-medium text-slate-800">₹{invoice.roundOff.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-950 pt-2 flex justify-between items-center text-sm font-black text-slate-950">
                    <span>Grand Total:</span>
                    <span className="text-base text-amber-700">₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-700">
                    <span>Paid Amount:</span>
                    <span className="font-bold text-emerald-700">₹{invoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Balance Due:</span>
                    <span className={invoice.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"}>
                      ₹{invoice.balanceAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank & Payment Info Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 mb-6 text-[11px]">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1">Bank & Payment Details</h4>
                  <p className="text-slate-600">Bank: <span className="font-semibold text-slate-900">{bankName}</span></p>
                  <p className="text-slate-600">A/C No: <span className="font-mono font-semibold text-slate-900">{accountNumber}</span></p>
                  <p className="text-slate-600">IFSC Code: <span className="font-mono font-semibold text-slate-900">{ifscCode}</span></p>
                  <p className="text-slate-600">UPI ID: <span className="font-mono font-bold text-amber-700">{shopUpi}</span></p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1">Terms & Conditions</h4>
                  <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {terms}
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-300 text-xs">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1 h-8"></div>
                  <p className="text-[11px] font-medium text-slate-600">Customer's Signature</p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">For {shopName}</p>
                  <div className="w-44 border-b border-slate-950 mb-1"></div>
                  <p className="text-[11px] font-bold text-slate-900">Authorized Signatory</p>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================
               80MM THERMAL RECEIPT TEMPLATE (POS STYLE)
            ========================================================= */
            <div
              id="printable-thermal"
              className="w-80 bg-white text-slate-950 p-4 shadow-xl text-[11px] font-mono leading-tight border border-slate-300 print:shadow-none print:w-full print:border-none print:p-0"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                <h2 className="text-base font-black uppercase tracking-tight">{shopName}</h2>
                <p className="text-[10px] text-slate-600 uppercase">{shopTagline}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{shopAddress}</p>
                <p className="text-[10px] font-bold mt-0.5">Ph: {shopPhone}</p>
                <p className="text-[10px] font-bold">GSTIN: {shopGstin}</p>
                <div className="mt-1.5 inline-block font-bold text-[10px] border border-black px-2 py-0.5 uppercase">
                  {invoice.invoiceType.replace(/_/g, " ")}
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>INV NO:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold">{invoice.customerName}</span>
                </div>
                {invoice.customerPhone && (
                  <div className="flex justify-between">
                    <span>PHONE:</span>
                    <span>{invoice.customerPhone}</span>
                  </div>
                )}
                {invoice.customerGstin && (
                  <div className="flex justify-between">
                    <span>CUST GSTIN:</span>
                    <span className="font-bold">{invoice.customerGstin}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1 text-[9px] uppercase">
                  <span className="w-2/5">ITEM</span>
                  <span className="w-1/5 text-right">QTY</span>
                  <span className="w-1/5 text-right">RATE</span>
                  <span className="w-1/5 text-right">TOTAL</span>
                </div>
                <div className="space-y-1">
                  {invoice.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <div className="w-2/5 truncate">
                        <span className="font-semibold">{it.description}</span>
                        <div className="text-[8px] text-slate-500 font-normal">HSN:{it.hsnSacCode} GST:{it.gstRate}%</div>
                      </div>
                      <div className="w-1/5 text-right">{it.quantity}</div>
                      <div className="w-1/5 text-right">₹{it.rate.toFixed(0)}</div>
                      <div className="w-1/5 text-right font-bold">₹{it.totalAmount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span>₹{invoice.taxableAmount.toFixed(2)}</span>
                </div>
                {invoice.isInterState ? (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{invoice.igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST:</span>
                      <span>₹{invoice.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span>₹{invoice.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Paid Amount:</span>
                  <span className="font-bold">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Balance Due:</span>
                  <span>₹{invoice.balanceAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-600 space-y-1 pt-1">
                <p>UPI ID: <span className="font-bold">{shopUpi}</span></p>
                <p className="font-semibold">{config?.footerNote || "Thank you for visiting!"}</p>
                <p className="text-[8px] text-slate-400">Computer Generated Invoice</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
