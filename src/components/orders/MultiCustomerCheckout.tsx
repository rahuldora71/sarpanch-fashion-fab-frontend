import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, ShoppingCart, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { removeSession, resetCheckout, submitAllOrders, setActiveSession } from "@/features/checkout/checkoutSlice";
import type { CustomerOrderDraft } from "@/types/orderEdit";

interface Props {
  onAddAnotherCustomer: () => void;
  onViewOrders: () => void;
  onPrintInvoice: (orders: import("@/types/orderEdit").CompleteOrderResponse[]) => void;
  onDownloadInvoice?: (orders: import("@/types/orderEdit").CompleteOrderResponse[]) => void;
}

/**
 * Multi-customer checkout summary panel.
 * Shows all pending order sessions and their totals.
 * Submits them all when the user confirms.
 */
export default function MultiCustomerCheckout({
  onAddAnotherCustomer,
  onViewOrders,
  onPrintInvoice,
  onDownloadInvoice,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, isSubmitting, confirmedOrders } = useSelector(
    (state: RootState) => state.checkout
  );

  const combinedTotal = sessions.reduce((sum, s) => sum + s.grandTotal, 0);
  const combinedPaid = sessions.reduce((sum, s) => sum + s.paymentAmount, 0);
  const combinedBalance = Math.max(0, combinedTotal - combinedPaid);

  const handleConfirmAll = () => {
    if (sessions.length === 0) return;
    dispatch(submitAllOrders(sessions));
  };

  const handleRemoveSession = (sessionId: string) => {
    dispatch(removeSession(sessionId));
  };

  // Confirmed state
  if (confirmedOrders.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto py-12 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Confirmed!</h2>
          <p className="text-gray-500 mt-2">
            {confirmedOrders.length}{" "}
            {confirmedOrders.length === 1 ? "order" : "orders"} successfully placed.
          </p>
        </div>

        <div className="space-y-2">
          {confirmedOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-gray-500">Order #{order.orderId}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{order.grandTotal.toFixed(2)}</p>
                <Badge variant="outline" className="text-xs">
                  Balance: ₹{order.balanceDue.toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={onViewOrders}>
            View Orders
          </Button>
          <Button onClick={() => onPrintInvoice(confirmedOrders)}>
            Print Invoice
          </Button>
          {onDownloadInvoice && (
            <Button variant="outline" onClick={() => onDownloadInvoice(confirmedOrders)}>
              Download PDF
            </Button>
          )}
          <Button variant="ghost" onClick={() => dispatch(resetCheckout())}>
            New Order
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Checkout</h2>
            <p className="text-sm text-gray-500">
              {sessions.length} {sessions.length === 1 ? "customer" : "customers"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onAddAnotherCustomer} className="gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* SESSION LIST */}
      <ScrollArea className="flex-1 px-6 py-4">
        {sessions.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No orders yet.</p>
            <Button className="mt-4" onClick={onAddAnotherCustomer}>
              Start Order
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  onRemove={() => handleRemoveSession(session.sessionId)}
                  onEdit={() => dispatch(setActiveSession(session.sessionId))}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>

      {/* SUMMARY + CONFIRM */}
      {sessions.length > 0 && (
        <div className="px-6 py-4 border-t space-y-3 shrink-0">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Combined Total</span>
              <span className="font-semibold">₹{combinedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="text-green-600 font-medium">₹{combinedPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Balance Due</span>
              <span className={combinedBalance > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                ₹{combinedBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          <Button
            className="w-full h-11 font-semibold text-base"
            onClick={handleConfirmAll}
            disabled={isSubmitting || sessions.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming orders...
              </>
            ) : (
              `Confirm ${sessions.length === 1 ? "Order" : `${sessions.length} Orders`}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}


// ============================================================
// SESSION CARD
// ============================================================

function SessionCard({
  session,
  onRemove,
  onEdit,
}: {
  session: CustomerOrderDraft;
  onRemove: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">{session.customerName}</CardTitle>
              <p className="text-xs text-gray-400">
                Sample Book: {session.sampleBookPageNumber || "—"}
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit} className="text-xs h-7">
                Edit
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-400 hover:bg-red-50"
                onClick={onRemove}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-gray-500 mb-2">
            {session.garments.length} garment{session.garments.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-1">
            {session.garments.map((g) => (
              <div key={g.tempId} className="flex justify-between text-sm">
                <span>{g.serviceName}</span>
                <span className="font-medium">₹{g.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {session.additionalCharges.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              {session.additionalCharges.map((c) => (
                <div key={c.tempId} className="flex justify-between text-xs text-gray-500">
                  <span>{c.description}</span>
                  <span>₹{c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>₹{session.grandTotal.toFixed(2)}</span>
          </div>
          {session.paymentAmount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Paid</span>
              <span>₹{session.paymentAmount.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
