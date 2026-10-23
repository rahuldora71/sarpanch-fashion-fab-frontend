import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Printer,
  Download,
  PackageCheck,
  FileText,
} from "lucide-react";

import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { orderService } from "@/services/orderService";
import OrderDeliveryDialog from "@/components/orders/OrderDeliveryDialog";
import {
  fromOrderDetails,
  printInvoice,
  downloadInvoicePdf,
} from "@/services/invoiceService";

import type {
  OrderPageParams,
  OrderResponse,
  PageResponse,
} from "@/types/order";

// =========================================================
// CONSTANTS
// =========================================================

const PAGE_SIZE = 20;

// =========================================================
// DATE
// =========================================================

const formatDate = (
  value?: string | null,
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

// =========================================================
// TIME
// =========================================================

const formatDateTime = (
  value?: string | null,
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

// =========================================================
// STAT CARD
// =========================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {value}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground/80 truncate">
            {description}
          </p>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <Icon className="size-4.5" />
        </div>
      </div>
    </Card>
  );
}

// =========================================================
// ORDER NUMBER
// =========================================================

const getOrderNumber = (
  order: OrderResponse,
): string => {
  return `ORD-${String(order.id).padStart(5, "0")}`;
};

// =========================================================
// PAGE
// =========================================================

export default function OrdersPage() {
  const navigate = useNavigate();

  // =======================================================
  // DATA
  // =======================================================

  const [orders, setOrders] = useState<OrderResponse[]>([]);

  const [pageInfo, setPageInfo] = useState<
    PageResponse<OrderResponse> | null
  >(null);

  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =======================================================
  // FILTERS
  // =======================================================

  const [search, setSearch] = useState("");

  // =======================================================
  // PAGINATION
  // =======================================================

  const [page, setPage] = useState(0);

  // =======================================================
  // LOAD ORDERS
  // =======================================================

  const loadOrders = useCallback(
    async (
      requestedPage = 0,
      showRefresh = false,
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params: OrderPageParams = {
          page: requestedPage,
          size: PAGE_SIZE,
          sort: "orderDate,desc",
        };

        const response =
          await orderService.getAllOrders(params);

        setOrders(response.content ?? []);
        setPageInfo(response);
        setPage(response.number ?? requestedPage);
      } catch (error) {
        console.error(
          "Failed to load orders:",
          error,
        );

        setOrders([]);
        setPageInfo(null);

        toast.error(
          "Failed to load orders.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    void loadOrders(0);
  }, [loadOrders]);

  // =======================================================
  // SEARCH
  // =======================================================

  const filteredOrders = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return orders;
    }

    return orders.filter((order) => {
      const orderNumber =
        getOrderNumber(order).toLowerCase();

      const customerName =
        order.customerName
          ?.toLowerCase() ?? "";

      const customerCode =
        order.customerCode
          ?.toLowerCase() ?? "";

      const sampleBookPage =
        order.sampleBookPageNumber
          ?.toLowerCase() ?? "";

      return (
        orderNumber.includes(keyword) ||
        customerName.includes(keyword) ||
        customerCode.includes(keyword) ||
        sampleBookPage.includes(keyword) ||
        String(order.id).includes(keyword)
      );
    });
  }, [orders, search]);

  // =======================================================
  // STATISTICS
  // =======================================================

  const statistics = useMemo(() => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const ordersToday = orders.filter(
      (order) =>
        order.orderDate?.startsWith(today),
    ).length;

    const totalElements =
      pageInfo?.totalElements ??
      orders.length;

    const firstOrderDate =
      orders.length > 0
        ? orders[orders.length - 1]?.orderDate
        : null;

    return {
      totalOrders: totalElements,
      ordersOnCurrentPage: orders.length,
      ordersToday,
      firstOrderDate,
    };
  }, [orders, pageInfo]);

  // =======================================================
  // VIEW ORDER
  // =======================================================

  const handleViewOrder = (
    orderId: number,
  ) => {
    navigate(`/orders/${orderId}`);
  };

  // =======================================================
  // INVOICE ACTIONS
  // =======================================================

  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [deliveringOrderId, setDeliveringOrderId] = useState<number | null>(null);

  const handleQuickPrint = async (orderId: number) => {
    setLoadingInvoiceId(orderId);
    try {
      const details = await orderService.getOrderDetails(orderId);
      const invData = fromOrderDetails(details);
      await printInvoice(invData);
    } catch {
      toast.error("Failed to load invoice for printing");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleQuickDownload = async (orderId: number) => {
    setLoadingInvoiceId(orderId);
    try {
      const details = await orderService.getOrderDetails(orderId);
      const invData = fromOrderDetails(details);
      await downloadInvoicePdf(invData);
    } catch {
      toast.error("Failed to download invoice PDF");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // =======================================================
  // PAGINATION
  // =======================================================

  const handlePreviousPage = () => {
    if (
      loading ||
      refreshing ||
      page <= 0
    ) {
      return;
    }

    void loadOrders(page - 1);
  };

  const handleNextPage = () => {
    if (
      loading ||
      refreshing ||
      pageInfo?.last
    ) {
      return;
    }

    void loadOrders(page + 1);
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="relative min-h-full overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/[0.07] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-0 size-96 rounded-full bg-primary/[0.05] blur-3xl" />
      <div className="relative z-10 mx-auto w-full max-w-[1600px] space-y-4 p-4 md:p-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />

              <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Orders
              </h1>
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage and view customer orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-border/70 bg-card/70 shadow-xs"
              onClick={() =>
                void loadOrders(
                  page,
                  true,
                )
              }
              disabled={refreshing}
              title="Refresh orders"
            >
              <RefreshCw
                className={
                  refreshing
                    ? "size-4 animate-spin"
                    : "size-4"
                }
              />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                navigate("/orders/historical-entry")
              }
              className="h-9 rounded-xl border-primary/30 bg-card/70 text-xs font-semibold text-primary shadow-xs transition-all hover:bg-primary/10"
            >
              <FileText className="mr-1.5 size-3.5" />
              Mass Upload Slips
            </Button>

            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold shadow-xs transition-all"
              onClick={() =>
                navigate("/orders/new")
              }
            >
              <Plus className="mr-1.5 size-3.5" />
              New Order
            </Button>
          </div>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          <StatCard
            title="Total Orders"
            value={statistics.totalOrders}
            description="Orders in the system"
            icon={ShoppingBag}
          />

          <StatCard
            title="Orders Today"
            value={statistics.ordersToday}
            description="Orders placed today"
            icon={CalendarDays}
          />

          <StatCard
            title="Showing"
            value={statistics.ordersOnCurrentPage}
            description={`Orders on page ${page + 1}`}
            icon={Package}
          />
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search order number, customer, code or sample page..."
            className="h-10 rounded-xl border-border/80 bg-card pl-9 text-xs sm:text-sm shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        {/* =================================================
            ORDER LIST
        ================================================= */}

        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5 sm:py-3.5">
            <div>
              <h2 className="font-semibold tracking-tight text-foreground text-sm sm:text-base">
                Orders
              </h2>

              <p className="text-xs text-muted-foreground">
                {filteredOrders.length} order
                {filteredOrders.length === 1
                  ? ""
                  : "s"} shown
              </p>
            </div>

            <Package className="size-4 text-muted-foreground" />
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="space-y-3 p-5 md:p-6">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-muted/80"
                />
              ))}
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                  <ShoppingBag className="size-6 text-muted-foreground" />
                </div>

                <h3 className="font-semibold tracking-tight text-foreground">
                  {search
                    ? "No matching orders"
                    : "No orders found"}
                </h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {search
                    ? "Try changing your search."
                    : "There are no orders available yet."}
                </p>

                {!search && (
                  <Button
                    type="button"
                    className="mt-5"
                    onClick={() =>
                      navigate(
                        "/orders/new",
                      )
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Create Order
                  </Button>
                )}
              </div>
            )}

          {/* =================================================
              DESKTOP
          ================================================= */}

          {!loading &&
            filteredOrders.length > 0 && (
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30">

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Order
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Order Date
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Sample Page
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Created
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="transition-colors duration-200 hover:bg-primary/[0.035]"
                        >

                          {/* ORDER */}

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              onClick={() =>
                                handleViewOrder(
                                  order.id,
                                )
                              }
                            >
                              <p className="font-semibold font-mono tracking-tight text-foreground transition-colors hover:text-primary">
                                {getOrderNumber(
                                  order,
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                ID: #{order.id}
                              </p>
                            </button>
                          </td>

                          {/* CUSTOMER */}

                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground text-sm">
                              {order.customerName ||
                                "Unknown Customer"}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                              {order.customerCode ||
                                "No customer code"}
                            </p>
                          </td>

                          {/* ORDER DATE */}

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="size-3.5 text-muted-foreground" />

                              <span className="text-sm text-foreground font-mono tabular-nums">
                                {formatDate(
                                  order.orderDate,
                                )}
                              </span>
                            </div>
                          </td>

                          {/* SAMPLE PAGE */}

                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground font-mono">
                              {order.sampleBookPageNumber ||
                                "—"}
                            </span>
                          </td>

                          {/* CREATED */}

                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground font-mono tabular-nums">
                              {formatDateTime(
                                order.createdAt,
                              )}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 cursor-pointer rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                title="Print Invoice"
                                disabled={loadingInvoiceId === order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickPrint(order.id);
                                }}
                              >
                                <Printer className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 cursor-pointer rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                title="Download PDF Invoice"
                                disabled={loadingInvoiceId === order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickDownload(order.id);
                                }}
                              >
                                <Download className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 cursor-pointer rounded-xl text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                                title="Deliver Order / Garments"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeliveringOrderId(order.id);
                                }}
                              >
                                <PackageCheck className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewOrder(
                                    order.id,
                                  )
                                }
                              >
                                View
                                <ChevronRight className="ml-1 size-4" />
                              </Button>
                            </div>
                          </td>

                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* =================================================
              MOBILE
          ================================================= */}

          {!loading &&
            filteredOrders.length > 0 && (
              <div className="divide-y divide-border/70 md:hidden">
                {filteredOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      onClick={() =>
                        handleViewOrder(
                          order.id,
                        )
                      }
                      className="w-full p-4 text-left transition-colors duration-200 hover:bg-primary/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tracking-tight text-foreground">
                            {getOrderNumber(
                              order,
                            )}
                          </p>

                          <p className="mt-1 text-sm text-foreground">
                            {order.customerName ||
                              "Unknown Customer"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.customerCode ||
                              "No customer code"}
                          </p>
                        </div>

                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-2 gap-4">

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Order Date
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(
                              order.orderDate,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Sample Page
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {order.sampleBookPageNumber ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Created
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(
                              order.createdAt,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Order ID
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            #{order.id}
                          </p>
                        </div>

                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 cursor-pointer gap-1.5 rounded-full text-xs font-medium"
                          disabled={loadingInvoiceId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickPrint(order.id);
                          }}
                        >
                          <Printer className="size-3.5 text-primary" />
                          <span>Print</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 cursor-pointer gap-1.5 rounded-full text-xs font-medium"
                          disabled={loadingInvoiceId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickDownload(order.id);
                          }}
                        >
                          <Download className="size-3.5 text-primary" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            pageInfo &&
            pageInfo.totalPages > 0 && (
              <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <div className="text-sm text-muted-foreground">
                  Page{" "}
                  <span className="font-medium text-foreground">
                    {pageInfo.number + 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {pageInfo.totalPages}
                  </span>

                  <span className="mx-1">
                    •
                  </span>

                  {pageInfo.totalElements} total orders
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                      handlePreviousPage
                    }
                    disabled={
                      loading ||
                      refreshing ||
                      pageInfo.first
                    }
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                      handleNextPage
                    }
                    disabled={
                      loading ||
                      refreshing ||
                      pageInfo.last
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

        </Card>
      </div>

      {deliveringOrderId && (
        <OrderDeliveryDialog
          isOpen={Boolean(deliveringOrderId)}
          onClose={() => setDeliveringOrderId(null)}
          orderId={deliveringOrderId}
          onSuccess={() => {
            void loadOrders(page, true);
          }}
        />
      )}
    </div>
  );
}