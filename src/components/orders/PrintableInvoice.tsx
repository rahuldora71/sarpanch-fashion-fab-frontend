import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import type { CompleteOrderResponse } from "@/types/orderEdit";

interface InvoiceProps {
  orders: CompleteOrderResponse[];
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

/**
 * Printable invoice component.
 * Accepts one or more order responses and renders a print-ready layout.
 * Use with window.print() or a print dialog.
 *
 * Usage:
 *   const invoiceRef = useRef<HTMLDivElement>(null);
 *   // ... wrap in a hidden div and call window.print()
 */
const PrintableInvoice = forwardRef<HTMLDivElement, InvoiceProps>(
  (
    {
      orders,
      shopName = "Sarpanch Fashion Fab",
      shopAddress = "",
      shopPhone = "",
    },
    ref
  ) => {
    const isCombined = orders.length > 1;
    const now = new Date();

    return (
      <div ref={ref} className="print-invoice p-8 bg-white text-gray-900 font-sans text-sm">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-invoice, .print-invoice * { visibility: visible; }
            .print-invoice { position: absolute; inset: 0; padding: 24px; }
            .no-print { display: none !important; }
          }
          .print-invoice { font-family: 'Segoe UI', Arial, sans-serif; }
        `}</style>

        {/* SHOP HEADER */}
        <div className="text-center mb-6">
          <img
            src="/brand/logo-badge.png"
            alt="Sarpanch Fashion Fab"
            className="w-16 h-16 object-contain mx-auto mb-2 rounded-full border border-gray-200"
          />
          <h1 className="text-2xl font-bold tracking-wide">{shopName}</h1>
          {shopAddress && <p className="text-gray-500 text-xs mt-0.5">{shopAddress}</p>}
          {shopPhone && <p className="text-gray-500 text-xs">Ph: {shopPhone}</p>}
          <p className="text-gray-400 text-xs mt-1">
            Printed: {format(now, "d MMM yyyy, h:mm a")}
          </p>
          <div className="mt-3 border-t border-b border-gray-300 py-1">
            <span className="font-bold text-base tracking-widest uppercase">
              {isCombined ? "Combined Invoice" : "Invoice / Receipt"}
            </span>
          </div>
        </div>

        {/* RENDER EACH ORDER */}
        {orders.map((order, idx) => (
          <div key={order.orderId} className={idx > 0 ? "mt-8 pt-6 border-t-2 border-dashed" : ""}>
            {/* ORDER + CUSTOMER META */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                <p className="font-bold text-base">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Order Details</p>
                <p className="font-bold">Order #{order.orderId}</p>
                {order.sampleBookPageNumber && (
                  <p className="text-xs text-gray-500">
                    Sample Book: {order.sampleBookPageNumber}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Date: {order.orderDate ? format(parseISO(order.orderDate), "d MMM yyyy") : "—"}
                </p>
              </div>
            </div>

            {/* GARMENTS TABLE */}
            <table className="w-full text-sm mb-4 border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="py-2 px-3 font-semibold">Item</th>
                  <th className="py-2 px-3 font-semibold text-right">Delivery</th>
                  <th className="py-2 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.garments.map((g) => (
                  <tr key={g.garmentId} className="border-b border-gray-100">
                    <td className="py-2 px-3">
                      <span className="font-medium">{g.serviceName}</span>
                      {g.sampleNumber && (
                        <span className="text-gray-400 text-xs ml-2">(#{g.sampleNumber})</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500 text-xs">—</td>
                    <td className="py-2 px-3 text-right font-medium">
                      ₹{(g.price ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* BILLING SUMMARY */}
            <div className="ml-auto w-56 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.additionalCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Additional Charges</span>
                  <span>₹{order.additionalCharges.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>− ₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                <span>Grand Total</span>
                <span>₹{order.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>₹{order.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-red-600">
                <span>Balance Due</span>
                <span>₹{order.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* COMBINED TOTAL for multi-order */}
        {isCombined && (
          <div className="mt-6 pt-4 border-t-2 border-gray-400">
            <div className="ml-auto w-56 space-y-1 text-sm">
              <p className="font-bold text-base mb-1">Combined Summary</p>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{orders.reduce((s, o) => s + o.grandTotal, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total Paid</span>
                <span>₹{orders.reduce((s, o) => s + o.totalPaid, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Balance Due</span>
                <span>₹{orders.reduce((s, o) => s + o.balanceDue, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-10 pt-4 border-t text-center text-xs text-gray-400">
          <p>Thank you for choosing {shopName}!</p>
          <p className="mt-0.5">Please keep this invoice for your records.</p>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";

export default PrintableInvoice;
