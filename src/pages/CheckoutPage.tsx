import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import MultiCustomerCheckout from "@/components/orders/MultiCustomerCheckout";
import {
  fromCompleteOrder,
  printInvoice,
  downloadInvoicePdf,
} from "@/services/invoiceService";
import type { CompleteOrderResponse } from "@/types/orderEdit";

/**
 * Checkout Page.
 * Hosts the multi-customer checkout session.
 * Accessible from the order creation flow or directly from the Orders page.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();

  const handlePrintInvoice = (orders: CompleteOrderResponse[]) => {
    const invoices = orders.map((o) => fromCompleteOrder(o));
    printInvoice(invoices);
  };

  const handleDownloadInvoice = (orders: CompleteOrderResponse[]) => {
    orders.forEach((o) => {
      const inv = fromCompleteOrder(o);
      downloadInvoicePdf(inv);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* PAGE HEADER */}
      <div className="px-4 md:px-6 pt-6 pb-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500">Review and confirm customer orders</p>
          </div>
        </div>
      </div>

      {/* CHECKOUT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-hidden"
      >
        <MultiCustomerCheckout
          onAddAnotherCustomer={() => navigate("/orders/new")}
          onViewOrders={() => navigate("/orders")}
          onPrintInvoice={handlePrintInvoice}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </motion.div>
    </div>
  );
}
