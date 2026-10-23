import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import PrintableInvoice from "./PrintableInvoice";
import type { CompleteOrderResponse } from "@/types/orderEdit";

interface Props {
  orders: CompleteOrderResponse[];
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

/**
 * Print button + preview dialog for invoices.
 * Opens a hidden preview, then triggers browser print.
 */
export default function InvoicePrinter({
  orders,
  shopName,
  shopAddress,
  shopPhone,
}: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    // Temporarily make visible for printing
    invoiceRef.current.classList.remove("hidden");

    // Wait a tick for styles, then print
    requestAnimationFrame(() => {
      window.print();
      // Optionally hide again after print (some browsers block this)
    });
  };

  return (
    <>
      <Button onClick={handlePrint} className="gap-2">
        <Printer className="w-4 h-4" />
        Print Invoice
      </Button>

      {/* Hidden printable invoice (only visible during print) */}
      <div ref={invoiceRef} className="hidden">
        <PrintableInvoice
          orders={orders}
          shopName={shopName}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
        />
      </div>
    </>
  );
}