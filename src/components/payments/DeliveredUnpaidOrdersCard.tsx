import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Phone,
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";
import { getDeliveredUnpaidOrders } from "@/services/paymentService";
import type { DeliveredUnpaidOrder, PageResponse } from "@/types/payment";
import RecordPaymentModal from "./RecordPaymentModal";

interface DeliveredUnpaidOrdersCardProps {
  compact?: boolean;
  className?: string;
  onRefreshParent?: () => void;
}

export const DeliveredUnpaidOrdersCard: React.FC<DeliveredUnpaidOrdersCardProps> = ({
  compact = false,
  className = "",
  onRefreshParent,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<PageResponse<DeliveredUnpaidOrder> | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = compact ? 5 : 10;

  // Payment Modal state
  const [selectedOrder, setSelectedOrder] = useState<DeliveredUnpaidOrder | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeliveredUnpaidOrders(debouncedSearch, page, pageSize);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch delivered unpaid orders:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPayment = (order: DeliveredUnpaidOrder) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchData();
    if (onRefreshParent) onRefreshParent();
  };

  const totalOutstanding =
    data?.content.reduce((acc, curr) => acc + (Number(curr.balanceDue) || 0), 0) || 0;

  const createWhatsAppUrl = (order: DeliveredUnpaidOrder) => {
    const phone = order.customerPhone?.replace(/\D/g, "") || "";
    const cleanPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const text = encodeURIComponent(
      `Namaste ${order.customerName}, your garments for Order #${order.orderId} have been delivered by Sarpanch Fashion Fab. A pending balance of ₹${order.balanceDue.toLocaleString("en-IN")} is remaining. Kindly arrange payment at your earliest convenience. Thank you!`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <>
      <Card className={`border-rose-200/80 bg-gradient-to-b from-rose-50/30 to-background dark:border-rose-950/60 dark:from-rose-950/10 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Delivered But Unpaid Orders
                  {data && data.totalElements > 0 && (
                    <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs font-semibold">
                      {data.totalElements} pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Customers who received their garments but have not settled full payment
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title="Refresh list"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>

              {compact && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/payments?tab=unpaid")}
                  className="h-8 text-xs font-medium"
                >
                  View All
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {!compact && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, phone, or order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              {data && (
                <div className="text-xs text-muted-foreground ml-auto hidden sm:block">
                  Page total pending:{" "}
                  <strong className="text-rose-600 font-bold">
                    ₹{totalOutstanding.toLocaleString("en-IN")}
                  </strong>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading && !data ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-rose-500 mb-2" />
              Loading unpaid delivered orders...
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                All Delivered Orders are Settled!
              </h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                No delivered garments currently have an outstanding balance due. Great job on collections!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y border-border/60 bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-2.5 px-4 font-semibold">Order</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Garments</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Paid</th>
                    <th className="py-2.5 px-4 font-semibold text-right text-rose-600">Balance Due</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.content.map((order) => (
                    <tr
                      key={order.orderId}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/orders?orderId=${order.orderId}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          #{order.orderId}
                        </Link>
                        <span className="text-[11px] text-muted-foreground block">
                          {order.orderDate}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          {order.customerCode && (
                            <span className="font-mono">{order.customerCode}</span>
                          )}
                          {order.customerPhone && (
                            <span>{order.customerPhone}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-medium gap-1"
                        >
                          <PackageCheck className="h-3 w-3" />
                          {order.deliveredGarments}/{order.totalGarments} Delivered
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-muted-foreground">
                        ₹{Number(order.grandTotal).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        ₹{Number(order.totalPaid).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                          ₹{Number(order.balanceDue).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.customerPhone && (
                            <>
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title={`Call ${order.customerPhone}`}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                              <a
                                href={createWhatsAppUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 transition-colors"
                                title="Send WhatsApp Payment Reminder"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleOpenPayment(order)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            <CreditCard className="mr-1 h-3.5 w-3.5" />
                            Collect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {data && data.totalPages > 1 && (
          <CardFooter className="py-2.5 px-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <span>
              Showing {data.number * data.size + 1} to{" "}
              {Math.min((data.number + 1) * data.size, data.totalElements)} of{" "}
              {data.totalElements} unpaid orders
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first || loading}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium">
                {data.number + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last || loading}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Record Payment Modal */}
      {selectedOrder && (
        <RecordPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedOrder(null);
          }}
          orderId={selectedOrder.orderId}
          customerName={selectedOrder.customerName}
          customerPhone={selectedOrder.customerPhone || undefined}
          balanceDue={selectedOrder.balanceDue}
          grandTotal={selectedOrder.grandTotal}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default DeliveredUnpaidOrdersCard;
