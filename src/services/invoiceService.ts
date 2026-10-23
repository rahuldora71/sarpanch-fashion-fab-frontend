import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import type { OrderDetailsResponse, CompleteOrderResponse as CompleteOrderResponseMain } from "@/types/order";
import type { CompleteOrderResponse as CompleteOrderResponseEdit } from "@/types/orderEdit";

export type AnyCompleteOrderResponse = CompleteOrderResponseMain | CompleteOrderResponseEdit;

export type PrintPaperFormat = "A4" | "THERMAL_3INCH";

export interface InvoiceGarmentItem {
  garmentId?: number;
  serviceName: string;
  sampleNumber?: string | null;
  sampleBookPageNumber?: string | null;
  price: number;
  dueDate?: string | null;
  status?: string;
  madeByWorkerName?: string | null;
  cuttingByWorkerName?: string | null;
  addOns?: Array<{
    name: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

export interface InvoicePaymentItem {
  paymentId?: number;
  amount: number;
  paymentMethod: string;
  paymentType?: string;
  createdAt?: string | null;
}

export interface InvoiceData {
  orderId: number;
  orderNumber?: string;
  orderDate: string;
  createdAt?: string;
  sampleBookPageNumber?: string | null;

  // Customer
  customerName: string;
  customerPhone?: string;
  customerCode?: string;
  customerAddress?: string;

  // Financials
  subtotal: number;
  additionalCharges: number;
  discount: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;

  // Items & Payments
  garments: InvoiceGarmentItem[];
  charges?: Array<{ description: string; amount: number }>;
  payments?: InvoicePaymentItem[];

  // Shop Info
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopTagline?: string;
}

export interface InvoiceTemplateSettings {
  defaultPaperFormat: PrintPaperFormat;

  // Shop Details
  shopName: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  shopGstin?: string;
  shopEmail?: string;

  // Visual Theme (for A4)
  themeColor: string; // e.g. '#0f172a' | '#047857' | '#4338ca' | '#0369a1' | '#b91c1c'
  headerStyle: "classic" | "modern" | "compact";

  // Content Visibility Toggles
  showLogoOrInitials: boolean;
  showCustomerCode: boolean;
  showCustomerPhone: boolean;
  showSampleBookPage: boolean;
  showGarmentDueDate: boolean;
  showTailorWorkerName: boolean;
  showAddOns: boolean;
  showPaymentHistory: boolean;
  showBalanceBadge: boolean;
  showTerms: boolean;
  showQrCode: boolean;

  // Custom Notes & Policy
  termsAndConditions: string;
  footerMessage: string;

  // Thermal Receipt Specific
  thermalFontSize: "compact" | "normal" | "large";
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceTemplateSettings = {
  defaultPaperFormat: "A4",
  shopName: "Sarpanch Fashion Fab",
  shopTagline: "Custom Tailoring, Designer Wear & Alterations",
  shopAddress: "Main Market, Fashion Fab Plaza",
  shopPhone: "+91 98765 43210",
  shopGstin: "07AAAAA0000A1Z5",
  shopEmail: "info@sarpanchfashion.com",
  themeColor: "#0f172a",
  headerStyle: "classic",

  showLogoOrInitials: true,
  showCustomerCode: true,
  showCustomerPhone: true,
  showSampleBookPage: true,
  showGarmentDueDate: true,
  showTailorWorkerName: true,
  showAddOns: true,
  showPaymentHistory: true,
  showBalanceBadge: true,
  showTerms: true,
  showQrCode: true,

  termsAndConditions:
    "1. Please present this bill/receipt at the time of delivery.\n2. In case of alteration, kindly notify within 7 days of collection.\n3. Garments not collected within 30 days are subject to shop storage policy.",
  footerMessage: "Thank you for choosing Sarpanch Fashion Fab! Visit again.",
  thermalFontSize: "normal",
};

/**
 * Retrieve saved invoice settings from localStorage
 */
export function getInvoiceSettings(): InvoiceTemplateSettings {
  try {
    const raw = localStorage.getItem("sff_invoice_settings");
    if (raw) {
      return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_INVOICE_SETTINGS;
}

/**
 * Persist invoice settings to localStorage
 */
export function saveInvoiceSettings(settings: InvoiceTemplateSettings): void {
  try {
    localStorage.setItem("sff_invoice_settings", JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save invoice settings", err);
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(val?: number | null): string {
  const num = Number(val || 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Safe date formatter
 */
export function formatDateSafe(val?: string | null, formatStr: string = "d MMM yyyy"): string {
  if (!val) return "—";
  try {
    return format(parseISO(val), formatStr);
  } catch {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return format(d, formatStr);
    }
    return val;
  }
}

/**
 * Sample mock invoice data for the live preview studio
 */
export function getSampleInvoiceData(): InvoiceData {
  const todayStr = new Date().toISOString();
  return {
    orderId: 1042,
    orderNumber: "#1042",
    orderDate: todayStr,
    createdAt: todayStr,
    sampleBookPageNumber: "48",

    customerName: "Vikram Malhotra",
    customerPhone: "+91 98765 12345",
    customerCode: "CUST-1042",
    customerAddress: "Flat 402, Royal Residency, City Center",

    subtotal: 7200,
    additionalCharges: 300,
    discount: 500,
    grandTotal: 7000,
    totalPaid: 3500,
    balanceDue: 3500,

    garments: [
      {
        garmentId: 1,
        serviceName: "Bespoke Two-Piece Suit",
        sampleNumber: "1",
        price: 5400,
        dueDate: new Date(Date.now() + 604800000).toISOString(),
        madeByWorkerName: "Suresh Master",
        cuttingByWorkerName: "Dinesh",
        addOns: [
          { name: "Satin Lapel Contrast", quantity: 1, totalPrice: 350 },
          { name: "Custom Monogram Cuff", quantity: 2, totalPrice: 150 },
        ],
      },
      {
        garmentId: 2,
        serviceName: "Formal Trouser & Shirt",
        sampleNumber: "2",
        price: 1800,
        dueDate: new Date(Date.now() + 432000000).toISOString(),
        madeByWorkerName: "Ramesh Tailor",
        cuttingByWorkerName: "Dinesh",
        addOns: [
          { name: "French Cuffs", quantity: 1, totalPrice: 100 },
        ],
      },
    ],

    charges: [
      { description: "Urgent Express Delivery Charge", amount: 300 },
    ],

    payments: [
      {
        paymentId: 101,
        amount: 3500,
        paymentMethod: "UPI / GPAY",
        paymentType: "ADVANCE",
        createdAt: todayStr,
      },
    ],
  };
}

/**
 * Convert OrderDetailsResponse to standard InvoiceData
 */
export function fromOrderDetails(
  order: OrderDetailsResponse,
  shopOverrides?: Partial<InvoiceTemplateSettings>
): InvoiceData {
  const currentSettings = { ...getInvoiceSettings(), ...shopOverrides };
  return {
    shopName: currentSettings.shopName,
    shopTagline: currentSettings.shopTagline,
    shopAddress: currentSettings.shopAddress,
    shopPhone: currentSettings.shopPhone,

    orderId: order.orderId,
    orderNumber: `#${order.orderId}`,
    orderDate: order.orderDate,
    createdAt: order.createdAt,
    sampleBookPageNumber: order.sampleBookPageNumber,

    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    customerCode: order.customer.customerCode,

    subtotal: order.subtotal,
    additionalCharges: order.additionalCharges,
    discount: order.discount,
    grandTotal: order.grandTotal,
    totalPaid: order.totalPaid,
    balanceDue: order.balanceDue,

    garments: (order.garments || []).map((g) => ({
      garmentId: g.garmentId,
      serviceName: g.serviceName,
      sampleNumber: g.sampleNumber,
      sampleBookPageNumber: order.sampleBookPageNumber,
      price: g.price,
      dueDate: g.dueDate,
      status: g.status,
      madeByWorkerName: g.madeByWorkerName,
      cuttingByWorkerName: g.cuttingByWorkerName,
      addOns: (g.addOns || []).map((a) => ({
        name: a.name,
        quantity: a.quantity,
        unitPrice: a.unitPrice,
        totalPrice: a.totalPrice,
      })),
    })),

    charges: (order.charges || []).map((c) => ({
      description: c.description,
      amount: c.amount,
    })),

    payments: (order.payments || []).map((p) => ({
      paymentId: p.paymentId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      createdAt: p.createdAt,
    })),
  };
}

/**
 * Convert CompleteOrderResponse to InvoiceData
 */
export function fromCompleteOrder(
  order: AnyCompleteOrderResponse,
  extra?: {
    customerPhone?: string;
    customerAddress?: string;
    dueDate?: string;
  },
  shopOverrides?: Partial<InvoiceTemplateSettings>
): InvoiceData {
  const currentSettings = { ...getInvoiceSettings(), ...shopOverrides };
  const paid =
    "totalPaid" in order
      ? order.totalPaid
      : (order as any).paymentAmount || 0;

  return {
    shopName: currentSettings.shopName,
    shopTagline: currentSettings.shopTagline,
    shopAddress: currentSettings.shopAddress,
    shopPhone: currentSettings.shopPhone,

    orderId: order.orderId,
    orderNumber: `#${order.orderId}`,
    orderDate: order.orderDate,
    createdAt: order.createdAt,
    sampleBookPageNumber: order.sampleBookPageNumber,

    customerName: order.customerName,
    customerPhone: extra?.customerPhone || "",
    customerAddress: extra?.customerAddress || "",

    subtotal: order.subtotal,
    additionalCharges: order.additionalCharges,
    discount: order.discount,
    grandTotal: order.grandTotal,
    totalPaid: Number(paid || 0),
    balanceDue: order.balanceDue,

    garments: (order.garments || []).map((g) => ({
      garmentId: g.garmentId,
      serviceName: g.serviceName,
      sampleNumber: g.sampleNumber,
      sampleBookPageNumber: order.sampleBookPageNumber,
      price: g.price,
      dueDate: extra?.dueDate || order.orderDate,
    })),

    charges:
      order.additionalCharges > 0
        ? [{ description: "Additional Charges", amount: order.additionalCharges }]
        : [],

    payments:
      paid > 0
        ? [
            {
              amount: Number(paid || 0),
              paymentMethod: (order as any).paymentMethod || "CASH / ADVANCE",
              paymentType: (order as any).paymentType || "ADVANCE",
              createdAt: order.createdAt,
            },
          ]
        : [],
  };
}

/**
 * Generate A4 standard format HTML
 */
export function generateA4InvoiceHtml(
  invoice: InvoiceData,
  settings: InvoiceTemplateSettings = getInvoiceSettings()
): string {
  const isPaidInFull = invoice.balanceDue <= 0;
  const printDateStr = format(new Date(), "d MMM yyyy, h:mm a");
  const theme = settings.themeColor || "#0f172a";

  const qrUrl = settings.showQrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
        `upi://pay?pn=${encodeURIComponent(settings.shopName)}&am=${invoice.balanceDue}&tn=Order%20${invoice.orderId}`
      )}`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - Order #${invoice.orderId} - ${invoice.customerName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 13px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          background: #ffffff;
        }
        @media print {
          @page { size: A4; margin: 10mm 12mm; }
          body { background: #ffffff; }
          .invoice-container { max-width: 100% !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid ${theme};
          padding-bottom: 18px;
          margin-bottom: 20px;
        }
        .shop-brand h1 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: ${theme};
          text-transform: uppercase;
        }
        .shop-brand p { color: #64748b; font-size: 12px; margin-top: 2px; }
        .shop-contact { font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4; }
        .invoice-badge-box { text-align: right; }
        .invoice-title { font-size: 20px; font-weight: 800; color: ${theme}; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-number { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .invoice-date { font-size: 11px; color: #64748b; margin-top: 2px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
        .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
        .meta-card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px; }
        .meta-customer-name { font-size: 15px; font-weight: 700; color: #0f172a; }
        .meta-info-row { display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-top: 3px; }
        .meta-info-label { color: #64748b; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: ${theme}; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 12px; }
        .items-table td:last-child { text-align: right; font-weight: 700; }
        .item-service-name { font-weight: 700; color: #0f172a; font-size: 13px; }
        .item-subtext { font-size: 11px; color: #64748b; margin-top: 2px; }
        .item-addon-tag { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-size: 10px; color: #334155; margin-right: 4px; margin-top: 3px; }
        .summary-container { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
        .notes-and-status { flex: 1; }
        .payment-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .badge-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .badge-due { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .payment-history-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 11px; }
        .payment-history-title { font-weight: 700; color: #475569; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
        .totals-table { width: 270px; border-collapse: collapse; font-size: 12px; }
        .totals-table td { padding: 4px 6px; }
        .totals-table td:last-child { text-align: right; font-weight: 600; }
        .totals-table tr.total-row td { border-top: 2px solid ${theme}; border-bottom: 2px solid ${theme}; font-size: 14px; font-weight: 800; padding: 6px; color: ${theme}; }
        .totals-table tr.due-row td { font-weight: 800; font-size: 13px; padding: 6px; color: ${isPaidInFull ? "#059669" : "#dc2626"}; }
        .terms-box { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #475569; margin-bottom: 16px; white-space: pre-line; line-height: 1.4; }
        .terms-title { font-weight: 700; color: #0f172a; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .invoice-footer { border-top: 1px solid #cbd5e1; padding-top: 14px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5; }
        .invoice-footer strong { color: #0f172a; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- HEADER -->
        <div class="invoice-header">
          <div class="shop-brand">
            <h1>${settings.shopName || invoice.shopName || "Sarpanch Fashion Fab"}</h1>
            <p>${settings.shopTagline || invoice.shopTagline || "Custom Tailoring & Designer Studio"}</p>
            <div class="shop-contact">
              ${settings.shopAddress ? `<div>📍 ${settings.shopAddress}</div>` : ""}
              ${settings.shopPhone ? `<div>📞 ${settings.shopPhone}</div>` : ""}
              ${settings.shopGstin ? `<div>GSTIN: <strong>${settings.shopGstin}</strong></div>` : ""}
            </div>
          </div>
          <div class="invoice-badge-box">
            <div class="invoice-title">Tax Invoice</div>
            <div class="invoice-number">Order #${invoice.orderId}</div>
            <div class="invoice-date">Order Date: ${formatDateSafe(invoice.orderDate)}</div>
            <div class="invoice-date">Printed: ${printDateStr}</div>
          </div>
        </div>

        <!-- META DETAILS -->
        <div class="meta-grid">
          <!-- CUSTOMER -->
          <div class="meta-card">
            <div class="meta-card-title">Billed To / Customer Details</div>
            <div class="meta-customer-name">${invoice.customerName}</div>
            ${settings.showCustomerPhone && invoice.customerPhone ? `<div class="meta-info-row"><span class="meta-info-label">Phone:</span><span>${invoice.customerPhone}</span></div>` : ""}
            ${settings.showCustomerCode && invoice.customerCode ? `<div class="meta-info-row"><span class="meta-info-label">Customer Code:</span><span>${invoice.customerCode}</span></div>` : ""}
            ${invoice.customerAddress ? `<div class="meta-info-row"><span class="meta-info-label">Address:</span><span>${invoice.customerAddress}</span></div>` : ""}
          </div>

          <!-- ORDER META -->
          <div class="meta-card">
            <div class="meta-card-title">Order Information</div>
            <div class="meta-info-row">
              <span class="meta-info-label">Order ID:</span>
              <strong>#${invoice.orderId}</strong>
            </div>
            ${settings.showSampleBookPage && invoice.sampleBookPageNumber ? `
              <div class="meta-info-row">
                <span class="meta-info-label">Sample Book Page:</span>
                <strong>Book #${invoice.sampleBookPageNumber}</strong>
              </div>
            ` : ""}
            <div class="meta-info-row">
              <span class="meta-info-label">Total Garments:</span>
              <span>${invoice.garments.length}</span>
            </div>
            <div class="meta-info-row">
              <span class="meta-info-label">Payment Status:</span>
              <strong style="color: ${isPaidInFull ? "#059669" : "#dc2626"};">
                ${isPaidInFull ? "Fully Paid" : "Balance Due"}
              </strong>
            </div>
          </div>
        </div>

        <!-- GARMENTS TABLE -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 38px;">#</th>
              <th>Description / Service</th>
              <th style="width: 140px;">Due Date / Maker</th>
              <th style="width: 110px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.garments
              .map((g, idx) => {
                const addOnsHtml =
                  settings.showAddOns && g.addOns && g.addOns.length > 0
                    ? `<div>${g.addOns
                        .map(
                          (a) =>
                            `<span class="item-addon-tag">+ ${a.name}${a.quantity > 1 ? ` (x${a.quantity})` : ""}${a.totalPrice ? ` [${formatCurrency(a.totalPrice)}]` : ""}</span>`
                        )
                        .join("")}</div>`
                    : "";

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <div class="item-service-name">${g.serviceName}</div>
                      ${g.sampleNumber ? `<div class="item-subtext">Sample #${g.sampleNumber}</div>` : ""}
                      ${addOnsHtml}
                    </td>
                    <td>
                      ${settings.showGarmentDueDate && g.dueDate ? `<div>📅 ${formatDateSafe(g.dueDate)}</div>` : "<div>—</div>"}
                      ${settings.showTailorWorkerName && g.madeByWorkerName ? `<div class="item-subtext">🪡 Made by: ${g.madeByWorkerName}</div>` : ""}
                    </td>
                    <td>${formatCurrency(g.price)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <!-- SUMMARY & TOTALS -->
        <div class="summary-container">
          <!-- LEFT: PAYMENT DETAILS & BADGE -->
          <div class="notes-and-status">
            ${settings.showBalanceBadge ? `
              <div class="payment-status-badge ${isPaidInFull ? "badge-paid" : "badge-due"}">
                ${isPaidInFull ? "✓ Fully Settled" : `⚠ Balance Pending: ${formatCurrency(invoice.balanceDue)}`}
              </div>
            ` : ""}

            ${
              settings.showPaymentHistory && invoice.payments && invoice.payments.length > 0
                ? `
                <div class="payment-history-box">
                  <div class="payment-history-title">Payment History</div>
                  ${invoice.payments
                    .map(
                      (p) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span>${p.paymentMethod} (${p.paymentType || "Payment"})${p.createdAt ? ` · ${formatDateSafe(p.createdAt)}` : ""}:</span>
                      <strong>${formatCurrency(p.amount)}</strong>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                : ""
            }

            ${settings.showQrCode && qrUrl ? `
              <div style="margin-top: 12px; display: flex; align-items: center; gap: 10px;">
                <img src="${qrUrl}" alt="UPI QR" style="width: 72px; height: 72px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px;" />
                <div style="font-size: 11px; color: #64748b;">
                  <strong style="color: #0f172a; display: block;">UPI Quick Pay</strong>
                  Scan to settle balance ₹${invoice.balanceDue.toFixed(2)}
                </div>
              </div>
            ` : ""}
          </div>

          <!-- RIGHT: FINANCIAL BREAKDOWN -->
          <table class="totals-table">
            <tbody>
              <tr>
                <td style="color: #64748b;">Subtotal</td>
                <td>${formatCurrency(invoice.subtotal)}</td>
              </tr>
              ${
                invoice.additionalCharges > 0
                  ? `
                <tr>
                  <td style="color: #64748b;">Additional Charges</td>
                  <td>${formatCurrency(invoice.additionalCharges)}</td>
                </tr>
              `
                  : ""
              }
              ${
                invoice.discount > 0
                  ? `
                <tr style="color: #16a34a;">
                  <td>Discount</td>
                  <td>- ${formatCurrency(invoice.discount)}</td>
                </tr>
              `
                  : ""
              }
              <tr class="total-row">
                <td>Grand Total</td>
                <td>${formatCurrency(invoice.grandTotal)}</td>
              </tr>
              <tr style="color: #16a34a; font-weight: 600;">
                <td>Total Paid</td>
                <td>${formatCurrency(invoice.totalPaid)}</td>
              </tr>
              <tr class="due-row">
                <td>Balance Due</td>
                <td>${formatCurrency(invoice.balanceDue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${settings.showTerms && settings.termsAndConditions ? `
          <div class="terms-box">
            <div class="terms-title">Terms & Conditions</div>
            <div>${settings.termsAndConditions}</div>
          </div>
        ` : ""}

        <!-- FOOTER / TERMS -->
        <div class="invoice-footer">
          <p>${settings.footerMessage || `Thank you for choosing ${settings.shopName || "Sarpanch Fashion Fab"}!`}</p>
          <p style="font-size: 10px; margin-top: 3px; color: #94a3b8;">
            Computer-generated receipt. Please present at the time of delivery.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate 3-Inch (80mm) Thermal Roll POS format HTML
 */
export function generateThermalInvoiceHtml(
  invoice: InvoiceData,
  settings: InvoiceTemplateSettings = getInvoiceSettings()
): string {
  const isPaidInFull = invoice.balanceDue <= 0;
  const printDateStr = format(new Date(), "dd/MM/yyyy HH:mm");

  const fontSizes = {
    compact: { base: "10px", title: "13px", header: "12px" },
    normal: { base: "11px", title: "15px", header: "13px" },
    large: { base: "12px", title: "17px", header: "14px" },
  }[settings.thermalFontSize || "normal"];

  const qrUrl = settings.showQrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        `upi://pay?pn=${encodeURIComponent(settings.shopName)}&am=${invoice.balanceDue}&tn=Order%20${invoice.orderId}`
      )}`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POS Receipt - #${invoice.orderId}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
          color: #000000;
          background: #ffffff;
          font-size: ${fontSizes.base};
          line-height: 1.35;
          width: 76mm;
          max-width: 76mm;
          margin: 0 auto;
          padding: 8px 4px 20px 4px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm 3mm;
          }
          body {
            width: 74mm;
            max-width: 74mm;
            padding: 2mm 0 15mm 0;
          }
          .no-print { display: none !important; }
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .divider {
          border-top: 1px dashed #000000;
          margin: 5px 0;
        }

        .double-divider {
          border-top: 2px dashed #000000;
          margin: 6px 0;
        }

        .shop-name {
          font-size: ${fontSizes.title};
          font-weight: 900;
          letter-spacing: 0.5px;
          line-height: 1.2;
        }

        .shop-sub {
          font-size: 10px;
          margin-top: 2px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: ${fontSizes.base};
          margin: 1px 0;
        }

        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
        }

        .item-entry {
          margin: 4px 0;
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }

        .item-details {
          font-size: 9.5px;
          padding-left: 6px;
        }

        .totals-section {
          margin: 5px 0;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          font-size: ${fontSizes.header};
          font-weight: 900;
          padding: 2px 0;
        }

        .balance-row {
          display: flex;
          justify-content: space-between;
          font-size: ${fontSizes.header};
          font-weight: 900;
          padding: 2px 0;
        }

        .qr-section {
          text-align: center;
          margin: 8px 0;
        }

        .qr-img {
          width: 90px;
          height: 90px;
          margin: 0 auto;
          display: block;
        }

        .footer-note {
          text-align: center;
          font-size: 9.5px;
          margin-top: 6px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="shop-name uppercase">${settings.shopName || invoice.shopName || "SARPANCH FASHION FAB"}</div>
        <div class="shop-sub">${settings.shopTagline || invoice.shopTagline || "Custom Tailoring & Designer Studio"}</div>
        ${settings.shopAddress ? `<div class="shop-sub">${settings.shopAddress}</div>` : ""}
        ${settings.shopPhone ? `<div class="shop-sub">PH: ${settings.shopPhone}</div>` : ""}
        ${settings.shopGstin ? `<div class="shop-sub">GSTIN: ${settings.shopGstin}</div>` : ""}
      </div>

      <div class="divider"></div>

      <div class="meta-row font-bold">
        <span>ORDER: #${invoice.orderId}</span>
        <span>${formatDateSafe(invoice.orderDate, "dd/MM/yy")}</span>
      </div>
      <div class="meta-row">
        <span>PRINTED:</span>
        <span>${printDateStr}</span>
      </div>
      ${settings.showSampleBookPage && invoice.sampleBookPageNumber ? `
        <div class="meta-row">
          <span>SAMPLE BOOK:</span>
          <span class="font-bold">#${invoice.sampleBookPageNumber}</span>
        </div>
      ` : ""}

      <div class="divider"></div>

      <div class="meta-row">
        <span>CUSTOMER:</span>
        <span class="font-bold uppercase">${invoice.customerName}</span>
      </div>
      ${settings.showCustomerPhone && invoice.customerPhone ? `
        <div class="meta-row">
          <span>PHONE:</span>
          <span>${invoice.customerPhone}</span>
        </div>
      ` : ""}
      ${settings.showCustomerCode && invoice.customerCode ? `
        <div class="meta-row">
          <span>CODE:</span>
          <span>${invoice.customerCode}</span>
        </div>
      ` : ""}

      <div class="divider"></div>

      <div class="items-header">
        <span>ITEM / SERVICE</span>
        <span>PRICE</span>
      </div>

      <div class="divider"></div>

      ${invoice.garments
        .map(
          (g, idx) => `
        <div class="item-entry">
          <div class="item-main">
            <span>${idx + 1}. ${g.serviceName}${g.sampleNumber ? ` (#${g.sampleNumber})` : ""}</span>
            <span>${formatCurrency(g.price)}</span>
          </div>
          ${
            settings.showGarmentDueDate && g.dueDate
              ? `<div class="item-details">DUE: ${formatDateSafe(g.dueDate, "dd/MM/yyyy")}</div>`
              : ""
          }
          ${
            settings.showTailorWorkerName && g.madeByWorkerName
              ? `<div class="item-details">TAILOR: ${g.madeByWorkerName}</div>`
              : ""
          }
          ${
            settings.showAddOns && g.addOns && g.addOns.length > 0
              ? g.addOns
                  .map(
                    (a) =>
                      `<div class="item-details">+ ${a.name}${a.quantity > 1 ? ` x${a.quantity}` : ""}${a.totalPrice ? ` (${formatCurrency(a.totalPrice)})` : ""}</div>`
                  )
                  .join("")
              : ""
          }
        </div>
      `
        )
        .join("")}

      <div class="divider"></div>

      <div class="totals-section">
        <div class="meta-row">
          <span>SUBTOTAL:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${
          invoice.additionalCharges > 0
            ? `
          <div class="meta-row">
            <span>ADDITIONAL:</span>
            <span>+ ${formatCurrency(invoice.additionalCharges)}</span>
          </div>
        `
            : ""
        }
        ${
          invoice.discount > 0
            ? `
          <div class="meta-row">
            <span>DISCOUNT:</span>
            <span>- ${formatCurrency(invoice.discount)}</span>
          </div>
        `
            : ""
        }

        <div class="double-divider"></div>

        <div class="grand-total-row">
          <span>TOTAL:</span>
          <span>${formatCurrency(invoice.grandTotal)}</span>
        </div>
        <div class="meta-row">
          <span>PAID:</span>
          <span>${formatCurrency(invoice.totalPaid)}</span>
        </div>

        <div class="double-divider"></div>

        <div class="balance-row">
          <span>${isPaidInFull ? "STATUS:" : "BALANCE DUE:"}</span>
          <span>${isPaidInFull ? "PAID IN FULL" : formatCurrency(invoice.balanceDue)}</span>
        </div>
      </div>

      ${
        settings.showPaymentHistory && invoice.payments && invoice.payments.length > 0
          ? `
        <div class="divider"></div>
        <div style="font-size: 9.5px; font-weight: bold; margin-bottom: 2px;">PAYMENTS:</div>
        ${invoice.payments
          .map(
            (p) => `
          <div class="meta-row" style="font-size: 9px;">
            <span>${p.paymentMethod} (${p.paymentType || "PAID"}):</span>
            <span>${formatCurrency(p.amount)}</span>
          </div>
        `
          )
          .join("")}
      `
          : ""
      }

      ${
        settings.showQrCode && qrUrl
          ? `
        <div class="divider"></div>
        <div class="qr-section">
          <img class="qr-img" src="${qrUrl}" alt="UPI QR" />
          <div style="font-size: 9px; margin-top: 3px; font-weight: bold;">SCAN TO PAY VIA UPI</div>
        </div>
      `
          : ""
      }

      <div class="divider"></div>

      ${
        settings.showTerms && settings.termsAndConditions
          ? `
        <div class="footer-note" style="text-align: left; white-space: pre-line;">
          ${settings.termsAndConditions}
        </div>
        <div class="divider"></div>
      `
          : ""
      }

      <div class="footer-note">
        <div class="font-bold">${settings.footerMessage || "THANK YOU! VISIT AGAIN"}</div>
        <div style="margin-top: 3px;">BRING THIS RECEIPT FOR DELIVERY</div>
      </div>

      <div style="height: 15px;"></div>
    </body>
    </html>
  `;
}

/**
 * Universal invoice HTML generator: automatically dispatches to A4 or 3-inch thermal POS roll
 */
export function generateInvoiceHtml(
  invoice: InvoiceData,
  settings: InvoiceTemplateSettings = getInvoiceSettings(),
  paperFormat?: PrintPaperFormat
): string {
  const chosenFormat = paperFormat || settings.defaultPaperFormat || "A4";
  if (chosenFormat === "THERMAL_3INCH") {
    return generateThermalInvoiceHtml(invoice, settings);
  }
  return generateA4InvoiceHtml(invoice, settings);
}

/**
 * Print invoice using an isolated iframe.
 */
export async function printInvoice(
  invoice: InvoiceData | InvoiceData[],
  options?: {
    format?: PrintPaperFormat;
    settings?: InvoiceTemplateSettings;
  }
): Promise<void> {
  const invoices = Array.isArray(invoice) ? invoice : [invoice];
  if (invoices.length === 0) return;

  const currentSettings = options?.settings || getInvoiceSettings();
  const formatChoice = options?.format || currentSettings.defaultPaperFormat || "A4";

  const htmlContent = invoices
    .map((inv) => generateInvoiceHtml(inv, currentSettings, formatChoice))
    .join(`
      <div style="page-break-after: always; height: 1px;"></div>
    `);

  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc || !iframe.contentWindow) {
        throw new Error("Unable to create printing context");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          }
        }, 300);
      };
    } catch (err) {
      toast.error("Failed to open print dialog");
      reject(err);
    }
  });
}

function cleanupOrphanedContainers() {
  if (typeof document === "undefined") return;
  try {
    const orphans = document.querySelectorAll(
      "div[style*='-9999px'], div[style*='position: fixed'][style*='left: -9999px']"
    );
    orphans.forEach((el) => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    });
  } catch {
    // Ignore cleanup error
  }
}

// Automatically clean up any orphaned container on script evaluation
if (typeof document !== "undefined") {
  cleanupOrphanedContainers();
}

/**
 * Download invoice directly as a PDF file
 */
export async function downloadInvoicePdf(
  invoice: InvoiceData,
  options?: {
    format?: PrintPaperFormat;
    settings?: InvoiceTemplateSettings;
  }
): Promise<void> {
  cleanupOrphanedContainers();
  const toastId = toast.loading("Generating PDF invoice...");
  const currentSettings = options?.settings || getInvoiceSettings();
  const formatChoice = options?.format || currentSettings.defaultPaperFormat || "A4";

  const isThermal = formatChoice === "THERMAL_3INCH";
  const iframeWidth = isThermal ? "350px" : "850px";

  // Create an isolated hidden iframe so styles NEVER leak into main document
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = iframeWidth;
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  iframe.style.background = "#ffffff";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error("Unable to access iframe document for PDF capture");
    }

    iframeDoc.open();
    iframeDoc.write(generateInvoiceHtml(invoice, currentSettings, formatChoice));
    iframeDoc.close();

    // Give browser time to layout fonts, tables, and QR images
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Capture canvas inside isolated iframe
    const captureTarget = iframeDoc.body;
    const canvas = await html2canvas(captureTarget, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: parseInt(iframeWidth, 10),
    });

    const imgData = canvas.toDataURL("image/png");

    if (isThermal) {
      // 80mm Roll continuous paper
      const pdfWidthMm = 80;
      const pdfHeightMm = Math.max(100, (canvas.height * pdfWidthMm) / canvas.width);
      const pdf = new jsPDF("p", "mm", [pdfWidthMm, pdfHeightMm]);

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
      const filename = `Thermal_Bill_Order_${invoice.orderId}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(filename);
    } else {
      // Standard A4
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `Invoice_Order_${invoice.orderId}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(filename);
    }

    toast.success("Invoice PDF downloaded!", { id: toastId });
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    toast.error("Could not generate PDF. Opening print dialog...", { id: toastId });
    await printInvoice(invoice, { format: formatChoice, settings: currentSettings });
  } finally {
    // ALWAYS remove iframe so main DOM remains completely clean
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    cleanupOrphanedContainers();
  }
}
