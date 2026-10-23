import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackageCheck,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  FileCheck2,
  Printer,
  Receipt,
  Download,
  Loader2,
  RefreshCw,
  Phone,
  UserCheck,
} from "lucide-react";
import { orderService } from "@/services/orderService";
import {
  fromOrderDetails,
  printInvoice,
  downloadInvoicePdf,
  type PrintPaperFormat,
} from "@/services/invoiceService";
import type {
  OrderDetailsResponse,
  OrderDeliveryResponse,
  PaymentMethod,
  PaymentType,
} from "@/types/order";
import toast from "react-hot-toast";

interface OrderDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  initialOrder?: OrderDetailsResponse | null;
  onSuccess?: (res: OrderDeliveryResponse) => void;
  initialGarmentId?: number | null;
}

export default function OrderDeliveryDialog({
  isOpen,
  onClose,
  orderId,
  initialOrder,
  onSuccess,
  initialGarmentId,
}: OrderDeliveryDialogProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [order, setOrder] = useState<OrderDetailsResponse | null>(
    initialOrder ?? null
  );
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected garment IDs for delivery
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<Set<number>>(
    new Set()
  );

  // Payment collection on delivery
  const [collectPayment, setCollectPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentType, setPaymentType] = useState<PaymentType>("FINAL");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Delivery remarks
  const [deliveryNote, setDeliveryNote] = useState<string>("");

  // Post-delivery completed result
  const [completedResult, setCompletedResult] =
    useState<OrderDeliveryResponse | null>(null);

  // Load fresh order details when dialog opens
  useEffect(() => {
    if (!isOpen || !orderId) return;

    setCompletedResult(null);

    const fetchOrder = async () => {
      setLoadingOrder(true);
      try {
        const details = await orderService.getOrderDetails(orderId);
        setOrder(details);

        // Pre-select initial garment if specified, else all garments not yet delivered
        if (initialGarmentId) {
          setSelectedGarmentIds(new Set([initialGarmentId]));
        } else {
          const pendingIds = new Set<number>();
          details.garments.forEach((g) => {
            if (g.status !== "DELIVERED") {
              pendingIds.add(g.garmentId);
            }
          });
          setSelectedGarmentIds(pendingIds);
        }

        // Set up payment fields
        const bal = details.balanceDue || 0;
        if (bal > 0) {
          setCollectPayment(true);
          setPaymentAmount(String(bal));
          setPaymentType("FINAL");
        } else {
          setCollectPayment(false);
          setPaymentAmount("");
        }
        setPaymentMethod("CASH");
        setPaymentNote("");
        setDeliveryNote("");
      } catch (err) {
        console.error("Failed to load order for delivery:", err);
        toast.error("Could not load order details.");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [isOpen, orderId]);

  // Garment stats
  const garments = order?.garments ?? [];
  const totalGarments = garments.length;
  const alreadyDeliveredGarments = useMemo(
    () => garments.filter((g) => g.status === "DELIVERED"),
    [garments]
  );
  const pendingGarments = useMemo(
    () => garments.filter((g) => g.status !== "DELIVERED"),
    [garments]
  );

  // Toggle single garment
  const handleToggleGarment = (garmentId: number) => {
    setSelectedGarmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(garmentId)) {
        next.delete(garmentId);
      } else {
        next.add(garmentId);
      }
      return next;
    });
  };

  // Select all pending garments
  const handleSelectAllPending = () => {
    const next = new Set<number>();
    pendingGarments.forEach((g) => next.add(g.garmentId));
    setSelectedGarmentIds(next);
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedGarmentIds(new Set());
  };

  // Handle Delivery Submission
  const handleConfirmDelivery = async () => {
    if (selectedGarmentIds.size === 0) {
      toast.error("Please select at least one garment to deliver.");
      return;
    }

    if (!currentUser?.id) {
      toast.error("Session error: user ID missing. Please log in again.");
      return;
    }

    const numericAmount = collectPayment ? Number(paymentAmount) : 0;
    if (collectPayment && (isNaN(numericAmount) || numericAmount <= 0)) {
      toast.error("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await orderService.deliverOrderGarments(orderId, {
        garmentIds: Array.from(selectedGarmentIds),
        deliveredById: currentUser.id,
        deliveryNote: deliveryNote.trim() || undefined,
        paymentAmount: collectPayment && numericAmount > 0 ? numericAmount : undefined,
        paymentMethod: collectPayment && numericAmount > 0 ? paymentMethod : undefined,
        paymentType: collectPayment && numericAmount > 0 ? paymentType : undefined,
        paymentNote: collectPayment && numericAmount > 0 ? (paymentNote.trim() || undefined) : undefined,
      });

      toast.success(response.message || "Garments delivered successfully!");
      setCompletedResult(response);

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      console.error("Failed to deliver garments:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Failed to deliver garments.";
      toast.error(typeof msg === "string" ? msg : "Delivery failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Print Invoice
  const handlePrint = async (format: PrintPaperFormat) => {
    if (!order) return;
    try {
      const freshOrder = await orderService.getOrderDetails(orderId);
      const invData = fromOrderDetails(freshOrder);
      await printInvoice(invData, { format });
    } catch (err) {
      console.error("Invoice print error:", err);
      toast.error("Failed to generate invoice for printing.");
    }
  };

  // Handle Download Invoice
  const handleDownload = async (format: PrintPaperFormat) => {
    if (!order) return;
    try {
      const freshOrder = await orderService.getOrderDetails(orderId);
      const invData = fromOrderDetails(freshOrder);
      await downloadInvoicePdf(invData, { format });
    } catch (err) {
      console.error("Invoice download error:", err);
      toast.error("Failed to download invoice.");
    }
  };

  const isFullDelivery =
    selectedGarmentIds.size > 0 &&
    selectedGarmentIds.size === pendingGarments.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-2xl w-full sm:rounded-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* ================= HEADER ================= */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Deliver Order #{orderId}
                  {order && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-background text-foreground font-semibold"
                    >
                      {alreadyDeliveredGarments.length}/{totalGarments} Delivered
                    </Badge>
                  )}
                </DialogTitle>
                {order?.customer && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {order.customer.name}
                    </span>
                    {order.customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.customer.phone}
                      </span>
                    )}
                    {order.customer.customerCode && (
                      <span className="font-mono text-[11px] bg-muted px-1.5 py-0.2 rounded">
                        {order.customer.customerCode}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loadingOrder ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
              Loading order details...
            </div>
          ) : completedResult ? (
            /* COMPLETED SUCCESS SCREEN */
            <div className="py-6 text-center space-y-4 animate-in fade-in-50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {completedResult.fullyDelivered
                    ? "Order Fully Delivered!"
                    : "Garments Delivered Successfully!"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  {completedResult.message}
                </p>
              </div>

              {/* Status summary */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Garments Delivered
                  </span>
                  <strong className="text-sm font-bold text-foreground">
                    {completedResult.deliveredGarmentsCount} /{" "}
                    {completedResult.totalGarments}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Total Paid
                  </span>
                  <strong className="text-sm font-bold text-emerald-600">
                    ₹{completedResult.totalPaid.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Balance Due
                  </span>
                  <strong
                    className={`text-sm font-bold ${
                      completedResult.balanceDue > 0
                        ? "text-rose-600"
                        : "text-foreground"
                    }`}
                  >
                    ₹{completedResult.balanceDue.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* Invoice print options */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Print Updated Invoice / Receipt:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint("A4")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    Print A4 Invoice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint("THERMAL_3INCH")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Receipt className="h-3.5 w-3.5 text-primary" />
                    Print 3" POS Slip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload("A4")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* DELIVERY FORM */
            <>
              {/* STEP 1: GARMENTS SELECTION */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Scissors className="h-3.5 w-3.5 text-primary" />
                      Select Garments to Deliver
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Choose all garments or deliver only specific finished items
                    </p>
                  </div>
                  {pendingGarments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={handleSelectAllPending}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Select All ({pendingGarments.length})
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[11px] font-semibold text-muted-foreground hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {garments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    No garments found in this order.
                  </p>
                ) : (
                  <div className="space-y-2 border border-border/80 rounded-xl p-2 bg-muted/20 max-h-56 overflow-y-auto">
                    {garments.map((g, idx) => {
                      const isDelivered = g.status === "DELIVERED";
                      const isSelected = selectedGarmentIds.has(g.garmentId);

                      return (
                        <div
                          key={g.garmentId}
                          onClick={() => {
                            if (!isDelivered) handleToggleGarment(g.garmentId);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                            isDelivered
                              ? "bg-muted/40 border-border/40 opacity-70 cursor-not-allowed"
                              : isSelected
                              ? "bg-emerald-500/10 border-emerald-500/40 cursor-pointer shadow-xs"
                              : "bg-background border-border/70 hover:bg-muted/30 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isDelivered || isSelected}
                              disabled={isDelivered}
                              onCheckedChange={() => {
                                if (!isDelivered) handleToggleGarment(g.garmentId);
                              }}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-foreground">
                                  #{idx + 1} {g.serviceName}
                                </span>
                                {g.sampleNumber && (
                                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                    Tag: {g.sampleNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                {g.madeByWorkerName && (
                                  <span>Made by: {g.madeByWorkerName}</span>
                                )}
                                {g.customerFabric && (
                                  <span>• Customer Fabric</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-xs text-foreground">
                              ₹{Number(g.price || 0).toLocaleString("en-IN")}
                            </span>
                            {isDelivered ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 text-[10px] gap-1 font-medium"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Already Delivered
                              </Badge>
                            ) : (
                              <Badge
                                variant={g.status === "READY" ? "default" : "outline"}
                                className={`text-[10px] font-medium ${
                                  g.status === "READY"
                                    ? "bg-blue-600 text-white"
                                    : ""
                                }`}
                              >
                                {g.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Delivery mode indicator */}
                <div className="mt-2 flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground">
                    Selected for delivery:{" "}
                    <strong className="text-foreground">
                      {selectedGarmentIds.size} of {pendingGarments.length} pending
                    </strong>
                  </span>
                  {selectedGarmentIds.size > 0 && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        isFullDelivery
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {isFullDelivery ? "Full Order Delivery" : "Partial Garment Delivery"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* STEP 2: FINANCIAL / PAYMENT SETTLEMENT */}
              <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">
                      Financial Clearance
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Check balance due before handing over garments
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Order Total
                      </span>
                      <strong className="font-semibold text-foreground">
                        ₹{Number(order?.grandTotal || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Paid
                      </span>
                      <strong className="font-semibold text-emerald-600">
                        ₹{Number(order?.totalPaid || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Balance Due
                      </span>
                      <strong
                        className={`font-extrabold text-sm ${
                          (order?.balanceDue || 0) > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                        }`}
                      >
                        ₹{Number(order?.balanceDue || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                {(order?.balanceDue || 0) > 0 ? (
                  <div className="pt-2 border-t border-border/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="collectPayment"
                        checked={collectPayment}
                        onCheckedChange={(checked) =>
                          setCollectPayment(Boolean(checked))
                        }
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label
                        htmlFor="collectPayment"
                        className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                      >
                        <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                        Collect payment right now on delivery
                      </Label>
                    </div>

                    {collectPayment ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in-50">
                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Amount (₹) *
                          </Label>
                          <div className="relative mt-1">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="pl-6 h-8 text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Payment Method *
                          </Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={(val) => {
                              if (val) setPaymentMethod(val as PaymentMethod);
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">
                                <div className="flex items-center gap-1.5">
                                  <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Cash</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="UPI">
                                <div className="flex items-center gap-1.5">
                                  <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                                  <span>UPI / QR</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="CARD">
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                                  <span>Card / POS</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="BANK_TRANSFER">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-cyan-600" />
                                  <span>Bank</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="CHEQUE">
                                <div className="flex items-center gap-1.5">
                                  <FileCheck2 className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Cheque</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Payment Type *
                          </Label>
                          <Select
                            value={paymentType}
                            onValueChange={(val) => {
                              if (val) setPaymentType(val as PaymentType);
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FINAL">Final Settlement</SelectItem>
                              <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Notice: Delivering without full payment will list this order under{" "}
                          <strong>Delivered But Unpaid Orders</strong> with ₹
                          {Number(order?.balanceDue || 0).toLocaleString("en-IN")}{" "}
                          pending.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-500/10 p-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Order is fully paid! No balance collection required.</span>
                  </div>
                )}
              </div>

              {/* STEP 3: REMARKS & STAFF */}
              <div className="space-y-2">
                <Label htmlFor="deliveryNote" className="text-xs font-semibold">
                  Delivery Remarks (Optional)
                </Label>
                <Textarea
                  id="deliveryNote"
                  placeholder="e.g. Fitting trial inspected and verified, customer took delivery in person"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="text-xs h-16"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Staff Delivering:
                </span>
                <strong className="text-foreground">
                  {currentUser?.name || "Store Staff"}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 gap-2 sm:gap-0">
          {completedResult ? (
            <Button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto font-semibold"
            >
              Done & Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={submitting || selectedGarmentIds.size === 0 || loadingOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Delivery...
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4" />
                    Deliver {selectedGarmentIds.size} Selected Garment
                    {selectedGarmentIds.size === 1 ? "" : "s"}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
