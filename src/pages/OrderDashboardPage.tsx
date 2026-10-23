import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Package,
  Phone,
  Receipt,
  Ruler,
  Scissors,
  UserRound,
  Wallet,
  Printer,
  Download,
  ChevronDown,
  FileText,
  PackageCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Separator,
} from "@/components/ui/separator";

import {
  Skeleton,
} from "@/components/ui/skeleton";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import AddPaymentDialog from "@/components/orders/payment/AddPaymentDialog";
import OrderDeliveryDialog from "@/components/orders/OrderDeliveryDialog";

import { useAppSelector } from "@/app/hooks";

import {
  orderService,
} from "@/services/orderService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  OrderDetailsResponse,
  OrderGarmentDetails,
} from "@/types/order";
import {
  fromOrderDetails,
  printInvoice,
  downloadInvoicePdf,
  type PrintPaperFormat,
} from "@/services/invoiceService";


/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status?: string) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "DELIVERED":
      return "default";

    case "READY":
      return "default";

    case "CANCELLED":
      return "destructive";

    case "ALTERATION":
      return "secondary";

    default:
      return "outline";
  }
}


/* =========================================================
   SUMMARY CARD
========================================================= */

interface SummaryCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 truncate text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {value}
          </p>

          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
              {description}
            </p>
          )}
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
          {icon}
        </div>
      </div>
    </Card>
  );
}


/* =========================================================
   GARMENT CARD
========================================================= */

interface GarmentCardProps {
  garment: OrderGarmentDetails;
  index: number;
  fieldNameMap?: Record<string, string>;
  onDeliverGarment?: (garmentId: number) => void;
}

function GarmentCard({
  garment,
  index,
  fieldNameMap = {},
  onDeliverGarment,
}: GarmentCardProps) {
  const measurementCount = useMemo(() => {
    return Object.keys(
      garment.measurement?.measurementFields ?? {},
    ).length;
  }, [garment.measurement]);

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scissors className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base">
                Garment #{index + 1}
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {garment.serviceName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {garment.madeByWorkerName ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-2xs">
                <span className="text-sm">🪡</span>
                <span>Made by: {garment.madeByWorkerName}</span>
                {garment.madeByWorkerPhone && (
                  <span className="text-[10px] opacity-75">({garment.madeByWorkerPhone})</span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground text-xs font-medium">
                <span>🪡 Worker: Unallocated</span>
              </div>
            )}

            {garment.status === "ALTERATION" ? (
              <Badge className="bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 shadow-xs">
                <Scissors className="size-3.5" />
                Alteration
              </Badge>
            ) : (
              <Badge
                variant={getStatusVariant(garment.status)}
              >
                {formatStatus(garment.status)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {/* Alteration Notice Banner if garment is in alteration or has alteration details */}
        {(garment.status === "ALTERATION" || garment.alterationDeliveryDate || garment.alterationNote) && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <Scissors className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {garment.status === "ALTERATION" ? "Garment In Alteration" : "Alteration Details"}
                </span>
              </div>
              {garment.alterationDeliveryDate && (
                <div className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <span>Alteration Due:</span>
                  <span className="font-bold underline">{formatDate(garment.alterationDeliveryDate)}</span>
                </div>
              )}
            </div>

            {garment.alterationNote && (
              <p className="text-xs text-foreground bg-background/80 p-2.5 rounded border border-amber-500/20">
                <span className="font-semibold text-muted-foreground mr-1">Instructions:</span>
                {garment.alterationNote}
              </p>
            )}

            {/* Show alteration deltas if available */}
            {garment.measurement?.alteration && Object.keys(garment.measurement.alteration).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Fit Adjustments:</span>
                {Object.entries(garment.measurement.alteration).map(([fieldId, delta]) => {
                  const numDelta = Number(delta);
                  const isDeltaNum = !isNaN(numDelta);
                  const deltaLabel = isDeltaNum
                    ? (numDelta > 0 ? `+${numDelta}"` : `${numDelta}"`)
                    : String(delta);
                  return (
                    <Badge
                      key={fieldId}
                      variant="outline"
                      className="text-[11px] font-mono border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    >
                      {fieldNameMap[fieldId] || `Field #${fieldId}`}: {deltaLabel}
                    </Badge>
                  );
                })}
              </div>
            )}

            {garment.status === "ALTERATION" && onDeliverGarment && (
              <div className="pt-1.5 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onDeliverGarment(garment.garmentId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7.5 gap-1.5 shadow-xs"
                >
                  <PackageCheck className="size-3.5" />
                  Deliver This Garment
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Basic information */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfoItem
            label="Price"
            value={formatCurrency(garment.price)}
          />

          <InfoItem
            label="Sample Number"
            value={garment.sampleNumber || "—"}
          />

          <InfoItem
            label="Due Date"
            value={formatDate(garment.dueDate)}
          />

          <InfoItem
            label="Fabric"
            value={
              garment.customerFabric
                ? "Customer Fabric"
                : "Shop Fabric"
            }
          />

          {garment.madeByWorkerName && (
            <InfoItem
              label="Made by (Tailor)"
              value={garment.madeByWorkerName}
            />
          )}

          {garment.cuttingByWorkerName && (
            <InfoItem
              label="Cut by (Master)"
              value={garment.cuttingByWorkerName}
            />
          )}
        </div>

        <Separator />

        {/* Measurement */}

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ruler className="size-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Measurement
              </h3>
            </div>

            <Badge variant="secondary">
              {measurementCount} fields
            </Badge>
          </div>

          {measurementCount > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(
                garment.measurement?.measurementFields ?? {},
              ).map(([fieldId, value]) => (
                <div
                  key={fieldId}
                  className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground capitalize">
                    {fieldNameMap[fieldId] || fieldId}
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {String(value ?? "—")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No measurement data available.
            </p>
          )}
        </div>

        {/* Add-ons */}

        {garment.addOns?.length > 0 && (
          <>
            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Package className="size-4 text-primary" />

                <h3 className="text-sm font-semibold">
                  Add-ons
                </h3>
              </div>

              <div className="space-y-2">
                {garment.addOns.map((addOn) => (
                  <div
                    key={addOn.garmentAddOnId}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/20 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {addOn.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {addOn.quantity} ×{" "}
                        {formatCurrency(addOn.unitPrice)}
                      </p>

                      {addOn.note && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {addOn.note}
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-sm font-semibold">
                      {formatCurrency(addOn.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes */}

        {(garment.note || garment.measurement?.note) && (
          <>
            <Separator />

            <div>
              <p className="mb-2 text-sm font-semibold">
                Notes
              </p>

              {garment.note && (
                <p className="text-sm text-muted-foreground">
                  {garment.note}
                </p>
              )}

              {garment.measurement?.note && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Measurement: {garment.measurement.note}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function OrderDashboardPage() {
  const navigate = useNavigate();

  const { orderId } = useParams<{
    orderId: string;
  }>();

  /*
   * Logged-in user.
   *
   * The backend payment API requires receivedById,
   * so we use the authenticated user's ID here.
   */
  const currentUser = useAppSelector(
    (state) => state.auth.user,
  );

  const [order, setOrder] =
    useState<OrderDetailsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  /* =======================================================
     LOAD ORDER
  ======================================================= */

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const numericOrderId = Number(orderId);

    if (
      !Number.isInteger(numericOrderId) ||
      numericOrderId <= 0
    ) {
      setError("Invalid order ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response =
        await orderService.getOrderDetails(
          numericOrderId,
        );

      setOrder(response);
    } catch (err) {
      console.error(
        "Failed to load order:",
        err,
      );

      setError(
        "Unable to load this order.",
      );

      toast.error(
        "Unable to load order.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);


  const { fieldNameMap } = useMeasurementFields();

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);


  /* =======================================================
     PAYMENT STATE
  ======================================================= */

  const balanceDue = Number(
    order?.balanceDue ?? 0,
  );

  const canAddPayment =
    Boolean(currentUser?.id) &&
    balanceDue > 0;

  /* =======================================================
     INVOICE ACTIONS
  ======================================================= */

  const [printingInvoice, setPrintingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedDeliverGarmentId, setSelectedDeliverGarmentId] = useState<number | null>(null);

  const handlePrintInvoice = async (targetFormat?: PrintPaperFormat) => {
    if (!order) return;
    setPrintingInvoice(true);
    try {
      const invData = fromOrderDetails(order);
      await printInvoice(invData, targetFormat ? { format: targetFormat } : undefined);
    } finally {
      setPrintingInvoice(false);
    }
  };

  const handleDownloadInvoice = async (targetFormat?: PrintPaperFormat) => {
    if (!order) return;
    setDownloadingInvoice(true);
    try {
      const invData = fromOrderDetails(order);
      await downloadInvoicePdf(invData, targetFormat ? { format: targetFormat } : undefined);
    } finally {
      setDownloadingInvoice(false);
    }
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-full bg-background">
        <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 md:px-6 lg:px-8">
          <Skeleton className="h-8 w-56" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 rounded-xl"
                />
              ),
            )}
          </div>

          <Skeleton className="h-48 rounded-xl" />

          <Skeleton className="h-80 rounded-xl" />
        </div>
      </main>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !order) {
    return (
      <main className="min-h-full bg-background">
        <div className="mx-auto flex min-h-[60vh] max-w-[700px] items-center justify-center px-4">
          <Card className="w-full border-border/70">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Receipt className="size-6" />
              </div>

              <div>
                <h1 className="text-lg font-semibold">
                  Order not found
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {error ??
                    "This order could not be loaded."}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate("/orders")
                }
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1500px] space-y-4 px-4 py-4 md:px-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate("/orders")
              }
              className="mt-0.5 shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Order #{order.orderId}
                </h1>

                <Badge variant="secondary">
                  {order.garments.length}{" "}
                  {order.garments.length === 1
                    ? "Garment"
                    : "Garments"}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Created{" "}
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PRINT INVOICE DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={printingInvoice}
                    className="gap-1.5 cursor-pointer font-medium"
                  >
                    <Printer className="size-4 text-primary" />
                    <span>{printingInvoice ? "Preparing..." : "Print Invoice"}</span>
                    <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => handlePrintInvoice("A4")}
                  className="flex items-center gap-2 cursor-pointer py-2"
                >
                  <FileText className="size-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Print A4 Sheet</span>
                    <span className="text-[10px] text-muted-foreground">Standard Laser / Inkjet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePrintInvoice("THERMAL_3INCH")}
                  className="flex items-center gap-2 cursor-pointer py-2"
                >
                  <Receipt className="size-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Print 3-Inch POS Roll</span>
                    <span className="text-[10px] text-muted-foreground">Thermal Receipt (80mm)</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* DOWNLOAD INVOICE DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={downloadingInvoice}
                    className="gap-1.5 cursor-pointer font-medium"
                  >
                    <Download className="size-4 text-primary" />
                    <span>{downloadingInvoice ? "Downloading..." : "Download PDF"}</span>
                    <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => handleDownloadInvoice("A4")}
                  className="flex items-center gap-2 cursor-pointer py-2"
                >
                  <FileText className="size-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Download A4 PDF</span>
                    <span className="text-[10px] text-muted-foreground">Standard Document</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownloadInvoice("THERMAL_3INCH")}
                  className="flex items-center gap-2 cursor-pointer py-2"
                >
                  <Receipt className="size-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Download 3-Inch Roll PDF</span>
                    <span className="text-[10px] text-muted-foreground">Continuous Roll (80mm)</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/orders/${order.orderId}/edit`,
                )
              }
              className="cursor-pointer"
            >
              Edit Order
            </Button>

            <Button
              type="button"
              onClick={() => {
                setSelectedDeliverGarmentId(null);
                setDeliveryDialogOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-1.5 shadow-xs"
            >
              <PackageCheck className="size-4" />
              Deliver Garments
            </Button>
          </div>
        </div>


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Grand Total"
            value={formatCurrency(order.grandTotal)}
            description={`Subtotal ${formatCurrency(order.subtotal)}`}
            icon={
              <IndianRupee className="size-5" />
            }
          />

          <SummaryCard
            title="Total Paid"
            value={formatCurrency(order.totalPaid)}
            description={
              order.payments.length
                ? `${order.payments.length} payment${
                    order.payments.length === 1
                      ? ""
                      : "s"
                  }`
                : "No payments"
            }
            icon={
              <CreditCard className="size-5" />
            }
          />

          <SummaryCard
            title="Balance Due"
            value={formatCurrency(order.balanceDue)}
            description={
              order.balanceDue > 0
                ? "Payment pending"
                : "Fully paid"
            }
            icon={
              <Wallet className="size-5" />
            }
          />

          <SummaryCard
            title="Garments"
            value={String(order.garments.length)}
            description={
              `${order.garments.filter(
                (item) =>
                  item.status === "DELIVERED",
              ).length} delivered`
            }
            icon={
              <Scissors className="size-5" />
            }
          />
        </div>


        {/* =================================================
            CUSTOMER + ORDER INFORMATION
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  {order.customer.image && (
                    <AvatarImage
                      src={order.customer.image}
                      alt={order.customer.name}
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <AvatarFallback>
                    <UserRound className="size-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {order.customer.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {order.customer.customerCode}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />

                  <span>
                    {order.customer.phone ||
                      "No phone"}
                  </span>
                </div>

                {order.customer.email && (
                  <div className="truncate text-sm text-muted-foreground">
                    {order.customer.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-primary" />
                Order Information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-5">
                <InfoItem
                  label="Order Date"
                  value={formatDate(
                    order.orderDate,
                  )}
                />

                <InfoItem
                  label="Sample Book Page"
                  value={
                    order.sampleBookPageNumber ||
                    "—"
                  }
                />

                <InfoItem
                  label="Created At"
                  value={formatDateTime(
                    order.createdAt,
                  )}
                />

                <InfoItem
                  label="Last Updated"
                  value={formatDateTime(
                    order.updatedAt,
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>


        {/* =================================================
            FINANCIAL SUMMARY
        ================================================= */}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  Payment Summary
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Track payments and outstanding balance
                </p>
              </div>

              {/* =================================================
                  ADD PAYMENT BUTTON
              ================================================= */}

              {currentUser?.id && (
                <AddPaymentDialog
                  orderId={order.orderId}
                  balanceDue={balanceDue}
                  receivedById={Number(
                    currentUser.id,
                  )}
                  onPaymentAdded={loadOrder}
                  disabled={!canAddPayment}
                />
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <InfoItem
                label="Subtotal"
                value={formatCurrency(
                  order.subtotal,
                )}
              />

              <InfoItem
                label="Discount"
                value={formatCurrency(
                  order.discount,
                )}
              />

              <InfoItem
                label="Additional Charges"
                value={formatCurrency(
                  order.additionalCharges,
                )}
              />

              <InfoItem
                label="Grand Total"
                value={formatCurrency(
                  order.grandTotal,
                )}
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Balance Due
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    balanceDue > 0
                      ? "text-destructive"
                      : "text-primary"
                  }`}
                >
                  {formatCurrency(balanceDue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* =================================================
            GARMENTS
        ================================================= */}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Garments
            </h2>

            <p className="text-sm text-muted-foreground">
              Garments, measurements and add-ons
              included in this order.
            </p>
          </div>

          <div className="space-y-4">
            {order.garments.map(
              (garment, index) => (
                <GarmentCard
                  key={garment.garmentId}
                  garment={garment}
                  index={index}
                  fieldNameMap={fieldNameMap}
                  onDeliverGarment={(gId) => {
                    setSelectedDeliverGarmentId(gId);
                    setDeliveryDialogOpen(true);
                  }}
                />
              ),
            )}
          </div>
        </div>


        {/* =================================================
            CHARGES + PAYMENTS
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Charges */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-4 text-primary" />
                Additional Charges
              </CardTitle>
            </CardHeader>

            <CardContent>
              {order.charges.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional charges.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.charges.map(
                    (charge) => (
                      <div
                        key={charge.chargeId}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {charge.description}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Charge #
                            {charge.chargeId}
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            charge.amount,
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Payments */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="size-4 text-primary" />
                  Payments
                </CardTitle>

                {currentUser?.id && (
                  <AddPaymentDialog
                    orderId={order.orderId}
                    balanceDue={balanceDue}
                    receivedById={Number(
                      currentUser.id,
                    )}
                    onPaymentAdded={loadOrder}
                    disabled={!canAddPayment}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map(
                    (payment) => (
                      <div
                        key={payment.paymentId}
                        className="rounded-lg border border-border/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              {payment.paymentMethod}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {payment.paymentType}
                              {" · "}
                              {formatDateTime(
                                payment.createdAt,
                              )}
                            </p>
                          </div>

                          <p className="text-sm font-semibold">
                            {formatCurrency(
                              payment.amount,
                            )}
                          </p>
                        </div>

                        {payment.note && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {payment.note}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderDeliveryDialog
        isOpen={deliveryDialogOpen}
        onClose={() => {
          setDeliveryDialogOpen(false);
          setSelectedDeliverGarmentId(null);
        }}
        orderId={order.orderId}
        initialOrder={order}
        initialGarmentId={selectedDeliverGarmentId}
        onSuccess={() => {
          loadOrder();
        }}
      />
    </main>
  );
}