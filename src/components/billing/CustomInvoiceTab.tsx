import React, { useState, useEffect, useMemo } from "react";
import type {
  CreateManualInvoicePayload,
  InvoiceItemDraft,
  TaxRule,
  Invoice,
} from "@/types/billingModule";
import {
  createManualInvoice,
  getBillingConfig,
  getActiveTaxRules,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FileText, RefreshCw, Calculator } from "lucide-react";
import toast from "react-hot-toast";

interface CustomInvoiceTabProps {
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const CustomInvoiceTab: React.FC<CustomInvoiceTabProps> = ({ onInvoiceCreated }) => {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Customer Details
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerGstin, setCustomerGstin] = useState<string>("");
  const [customerStateCode, setCustomerStateCode] = useState<string>("08");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("08 - Rajasthan");

  // Invoice Details
  const [invoiceType, setInvoiceType] = useState<string>("TAX_INVOICE");
  const [classification, setClassification] = useState<string>("CUSTOM_INVOICE");
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Line items
  const [items, setItems] = useState<InvoiceItemDraft[]>([
    {
      itemType: "FABRIC",
      description: "Raymond Shirting Fabric",
      hsnSacCode: "5208",
      quantity: 2.25,
      unit: "Mtr",
      rate: 450,
      discount: 0,
      gstRate: 5,
    },
  ]);

  useEffect(() => {
    getBillingConfig().then((cfg) => {
      setIsTaxInclusive(cfg.defaultTaxInclusive);
      setCustomerStateCode(cfg.stateCode || "08");
      setPlaceOfSupply(`${cfg.stateCode || "08"} - ${cfg.state || "Rajasthan"}`);
    }).catch(() => {});

    getActiveTaxRules().then((rules) => {
      setTaxRules(rules);
    }).catch(() => {});
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        itemType: "STITCHING",
        description: "",
        hsnSacCode: "9988",
        quantity: 1,
        unit: "Pcs",
        rate: 0,
        discount: 0,
        gstRate: 5,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) {
      toast.error("Invoice must have at least one line item.");
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceItemDraft, value: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: value };

    // Auto set HSN/SAC and GST based on configured tax rules
    if (field === "itemType") {
      const matched = taxRules.find((r) => r.category === value && r.active);
      if (matched) {
        copy[idx].hsnSacCode = matched.hsnSacCode;
        copy[idx].gstRate = matched.gstRate;
      } else {
        if (value === "FABRIC") copy[idx].hsnSacCode = "5208";
        else if (value === "STITCHING") copy[idx].hsnSacCode = "9988";
        else if (value === "ACCESSORY") copy[idx].hsnSacCode = "6205";
      }
    }

    setItems(copy);
  };

  // Live Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let taxable = 0;
    let tax = 0;

    items.forEach((it) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      const d = Number(it.discount) || 0;
      const gRate = Number(it.gstRate) || 0;

      const gross = q * r;
      const net = Math.max(0, gross - d);
      subtotal += net;

      if (gRate === 0) {
        taxable += net;
      } else if (isTaxInclusive) {
        const lineTaxable = net / (1 + gRate / 100);
        taxable += lineTaxable;
        tax += net - lineTaxable;
      } else {
        const lineTax = (net * gRate) / 100;
        taxable += net;
        tax += lineTax;
      }
    });

    const netSubtotal = Math.max(0, subtotal - discountAmount);
    const grandTotal = isTaxInclusive ? netSubtotal : taxable + tax;

    return {
      subtotal,
      discount: discountAmount,
      taxable,
      tax,
      grandTotal,
    };
  }, [items, discountAmount, isTaxInclusive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter customer name.");
      return;
    }

    if (items.some((it) => !it.description.trim() || it.rate <= 0)) {
      toast.error("Please ensure all items have a description and valid rate.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateManualInvoicePayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        customerStateCode,
        invoiceType,
        classification,
        isTaxInclusive,
        placeOfSupply,
        items,
        discount: discountAmount > 0 ? discountAmount : undefined,
        paymentMethod,
        paidAmount: paidAmount > 0 ? paidAmount : undefined,
        notes: notes.trim() || undefined,
      };

      const inv = await createManualInvoice(payload);
      toast.success(`Invoice ${inv.invoiceNumber} created successfully!`);
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerGstin("");
      setPaidAmount(0);
      setDiscountAmount(0);
      setNotes("");
      onInvoiceCreated(inv);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create manual invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Create Manual / Custom Invoice
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            For direct counter sales, standalone fabric selling, alterations, or job work.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
            <div>
              <Label className="text-xs font-semibold text-foreground">Customer Name *</Label>
              <Input
                required
                placeholder="Walk-in Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
              <Input
                placeholder="Mobile number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Customer GSTIN (Optional B2B)</Label>
              <Input
                placeholder="GSTIN if registered"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                className="text-xs font-mono uppercase mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Customer Address / City</Label>
              <Input
                placeholder="Address / locality"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* Document & Tax Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
            <div>
              <Label className="text-xs font-semibold text-foreground">Invoice Type</Label>
              <Select value={invoiceType} onValueChange={(val) => setInvoiceType(val || "TAX_INVOICE")}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TAX_INVOICE">TAX INVOICE</SelectItem>
                  <SelectItem value="BILL_OF_SUPPLY">BILL OF SUPPLY</SelectItem>
                  <SelectItem value="FABRIC_SALE">FABRIC SALE</SelectItem>
                  <SelectItem value="SERVICE_INVOICE">SERVICE INVOICE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Classification</Label>
              <Select value={classification} onValueChange={(val) => setClassification(val || "CUSTOM_INVOICE")}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM_INVOICE">Custom Invoice</SelectItem>
                  <SelectItem value="FABRIC_ONLY">Fabric Only</SelectItem>
                  <SelectItem value="STITCHING_ONLY">Stitching Only</SelectItem>
                  <SelectItem value="MIXED">Mixed (Fabric + Service)</SelectItem>
                  <SelectItem value="SERVICE_ONLY">Service Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Pricing Mode</Label>
              <div className="flex bg-muted rounded-md p-1 border border-border mt-1">
                <button
                  type="button"
                  onClick={() => setIsTaxInclusive(false)}
                  className={`flex-1 text-xs py-1 rounded font-medium transition-all ${
                    !isTaxInclusive ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground"
                  }`}
                >
                  Exclusive
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaxInclusive(true)}
                  className={`flex-1 text-xs py-1 rounded font-medium transition-all ${
                    isTaxInclusive ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground"
                  }`}
                >
                  Inclusive
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Place of Supply</Label>
              <Input
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Customer State Code</Label>
              <Input
                value={customerStateCode}
                onChange={(e) => setCustomerStateCode(e.target.value)}
                placeholder="08"
                className="text-xs font-mono mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Invoice Line Items</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line Item
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold uppercase text-[10px]">
                  <th className="pb-2 w-10 text-center">#</th>
                  <th className="pb-2 w-28">Type</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 w-24">HSN/SAC</th>
                  <th className="pb-2 w-20 text-right">Qty</th>
                  <th className="pb-2 w-20 text-center">Unit</th>
                  <th className="pb-2 w-24 text-right">Rate (₹)</th>
                  <th className="pb-2 w-20 text-center">GST %</th>
                  <th className="pb-2 w-28 text-right">Total (₹)</th>
                  <th className="pb-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((it, idx) => {
                  const lineTotal = (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0);
                  const effectiveLine = isTaxInclusive
                    ? lineTotal
                    : lineTotal + (lineTotal * (Number(it.gstRate) || 0)) / 100;

                  return (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="py-2.5 pr-2">
                        <Select
                          value={it.itemType}
                          onValueChange={(val) => updateItem(idx, "itemType", val)}
                        >
                          <SelectTrigger className="h-8 bg-background border-input text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="STITCHING">Stitching</SelectItem>
                            <SelectItem value="FABRIC">Fabric</SelectItem>
                            <SelectItem value="ACCESSORY">Accessory</SelectItem>
                            <SelectItem value="CUSTOM">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="py-2.5 pr-2">
                        <Input
                          required
                          placeholder="Item name / service"
                          value={it.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          className="h-8 bg-background border-input text-xs text-foreground"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <Input
                          placeholder="HSN/SAC"
                          value={it.hsnSacCode}
                          onChange={(e) => updateItem(idx, "hsnSacCode", e.target.value)}
                          className="h-8 bg-background border-input text-xs font-mono text-foreground"
                        />
                      </td>

                      <td className="py-2.5 pr-2 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          className="h-8 bg-background border-input text-xs font-mono text-right text-foreground"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <Input
                          placeholder="Mtr / Pcs"
                          value={it.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          className="h-8 bg-background border-input text-xs text-center text-foreground"
                        />
                      </td>

                      <td className="py-2.5 pr-2 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={it.rate}
                          onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                          className="h-8 bg-background border-input text-xs font-mono text-right text-foreground"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <Select
                          value={String(it.gstRate)}
                          onValueChange={(val) => updateItem(idx, "gstRate", Number(val))}
                        >
                          <SelectTrigger className="h-8 bg-background border-input text-xs text-center">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="0">0% (Nil)</SelectItem>
                            <SelectItem value="5">5% (Fab/Tailor)</SelectItem>
                            <SelectItem value="12">12% (Apparel)</SelectItem>
                            <SelectItem value="18">18% (Standard)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="py-2.5 text-right font-bold text-foreground font-mono">
                        ₹{effectiveLine.toFixed(2)}
                      </td>

                      <td className="py-2.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals & Settlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground">Payment & Settlement</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "CASH")}>
                  <SelectTrigger className="bg-background border-input text-xs text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI / QR</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Amount Paid Now (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono text-foreground mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Invoice Notes / Remarks</Label>
              <Input
                placeholder="Optional customer instructions or notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background border-input text-xs text-foreground mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Box */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground">Invoice Calculations</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross Total:</span>
              <span className="font-mono text-foreground">₹{calculatedTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxable Value:</span>
              <span className="font-mono text-foreground">₹{calculatedTotals.taxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Calculated GST:</span>
              <span className="font-mono text-primary font-semibold">+₹{calculatedTotals.tax.toFixed(2)}</span>
            </div>

            <div className="border-t border-border pt-2 flex justify-between text-base font-black text-foreground">
              <span>Grand Total:</span>
              <span className="text-primary font-mono font-bold">₹{calculatedTotals.grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground pt-1">
              <span>Paid Amount:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-semibold">
              <span>Balance Due:</span>
              <span className="font-mono text-destructive font-bold">
                ₹{Math.max(0, calculatedTotals.grandTotal - paidAmount).toFixed(2)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 font-bold h-10 shadow flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Create & Print Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
