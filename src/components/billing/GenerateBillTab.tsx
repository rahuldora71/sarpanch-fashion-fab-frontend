import React, { useEffect, useState, useMemo } from "react";
import type {
  EligibleOrder,
  GenerateInvoicePayload,
  InvoiceItemDraft,
  Invoice,
} from "@/types/billingModule";
import {
  getEligibleOrders,
  generateInvoice,
  getBillingConfig,
  updateGarmentFabricSource,
} from "@/services/billingModuleService";
import { classifyOrder } from "@/utils/garmentClassificationUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw,
  Scissors,
  Layers,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

interface GenerateBillTabProps {
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const GenerateBillTab: React.FC<GenerateBillTabProps> = ({ onInvoiceCreated }) => {
  const [orders, setOrders] = useState<EligibleOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [classificationFilter, setClassificationFilter] = useState<string>("ALL");
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Selected orders & garments
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<number[]>([]);

  // Generation options
  const [billingMode, setBillingMode] = useState<"FABRIC_CONVERTED" | "GARMENT_CONSOLIDATED" | "DETAILED_ITEMIZED">("FABRIC_CONVERTED");
  const [invoiceType, setInvoiceType] = useState<string>("TAX_INVOICE");
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(true);
  const [customerGstin, setCustomerGstin] = useState<string>("");
  const [customerStateCode, setCustomerStateCode] = useState<string>("08");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("08 - Rajasthan");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [advancePaidAmount, setAdvancePaidAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Bundled Fabric drafts editable by user in FABRIC_CONVERTED mode
  const [bundledFabricDrafts, setBundledFabricDrafts] = useState<InvoiceItemDraft[]>([]);

  // Load config
  useEffect(() => {
    getBillingConfig().then((cfg) => {
      setIsTaxInclusive(cfg.defaultTaxInclusive);
      setCustomerStateCode(cfg.stateCode || "08");
      setPlaceOfSupply(`${cfg.stateCode || "08"} - ${cfg.state || "Rajasthan"}`);
    }).catch(() => {});
  }, []);

  // Fetch eligible orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await getEligibleOrders({
        search,
        customer: customerFilter,
        classification: classificationFilter,
        billingStatus: billingStatusFilter,
        paymentStatus: paymentStatusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [classificationFilter, billingStatusFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Selection handlers
  const toggleSelectOrder = (orderId: number) => {
    const isSelected = selectedOrderIds.includes(orderId);
    if (isSelected) {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
      const ord = orders.find((o) => o.orderId === orderId);
      if (ord) {
        const gIds = ord.garments.map((g) => g.garmentId);
        setSelectedGarmentIds(selectedGarmentIds.filter((gid) => !gIds.includes(gid)));
      }
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
      const ord = orders.find((o) => o.orderId === orderId);
      if (ord) {
        const gIds = ord.garments.map((g) => g.garmentId);
        setSelectedGarmentIds(Array.from(new Set([...selectedGarmentIds, ...gIds])));
      }
    }
  };

  const toggleSelectAllVisible = () => {
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectedOrderIds([]);
      setSelectedGarmentIds([]);
    } else {
      const allIds = orders.map((o) => o.orderId);
      setSelectedOrderIds(allIds);
      const allGIds = orders.flatMap((o) => o.garments.map((g) => g.garmentId));
      setSelectedGarmentIds(allGIds);
    }
  };

  const toggleExpandOrder = (orderId: number) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectGarment = (garmentId: number, orderId: number) => {
    const isGSelected = selectedGarmentIds.includes(garmentId);
    let newGIds: number[];
    if (isGSelected) {
      newGIds = selectedGarmentIds.filter((id) => id !== garmentId);
    } else {
      newGIds = [...selectedGarmentIds, garmentId];
    }
    setSelectedGarmentIds(newGIds);

    if (!selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  // Garment Fabric Overrides for Billing
  const [garmentFabricOverrides, setGarmentFabricOverrides] = useState<Record<number, boolean>>({});

  const handleToggleGarmentFabricSource = async (orderId: number, garmentId: number, isCustomerCloth: boolean) => {
    // Optimistically update local override state
    setGarmentFabricOverrides((prev) => ({
      ...prev,
      [garmentId]: isCustomerCloth,
    }));

    // Update in orders state so card indicators and badges immediately recalculate
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const updatedGarments = ord.garments.map((g) => {
          if (g.garmentId !== garmentId) return g;
          const sBase = g.serviceBasePrice ?? 0;
          const excess = sBase > 0 && g.price > sBase;
          const hasShop = !isCustomerCloth;
          const fabricAmt = hasShop ? (excess ? g.price - sBase : 0) : 0;
          const stitchAmt = hasShop ? (excess ? sBase + g.addOnsTotal : g.price + g.addOnsTotal) : g.price + g.addOnsTotal;
          return {
            ...g,
            customerFabric: isCustomerCloth,
            hasShopFabric: hasShop,
            fabricAmount: fabricAmt,
            stitchingAmount: stitchAmt,
          };
        });

        const classificationRes = classifyOrder(updatedGarments);
        return {
          ...ord,
          garments: updatedGarments,
          classification: classificationRes.classification,
          fabricSummary: classificationRes.fabricSummary,
          stitchingAmount: classificationRes.totalStitchingAmount,
          fabricAmount: classificationRes.totalFabricAmount,
        };
      })
    );

    try {
      await updateGarmentFabricSource(garmentId, isCustomerCloth);
    } catch {
      toast.error("Failed to update fabric source on server");
    }
  };

  // Selected orders data calculation preview
  const selectedOrdersData = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.orderId));
  }, [orders, selectedOrderIds]);

  // Recalculate bundled fabric drafts when selected orders change
  useEffect(() => {
    if (selectedOrdersData.length === 0) {
      setBundledFabricDrafts([]);
      return;
    }

    // Group garments by service
    const groups: Record<
      string,
      { serviceName: string; count: number; totalAmount: number }
    > = {};

    selectedOrdersData.forEach((ord) => {
      ord.garments.forEach((g) => {
        if (selectedGarmentIds.length > 0 && !selectedGarmentIds.includes(g.garmentId)) {
          return;
        }
        const sName = g.serviceName || "Apparel";
        if (!groups[sName]) {
          groups[sName] = { serviceName: sName, count: 0, totalAmount: 0 };
        }
        groups[sName].count += 1;
        groups[sName].totalAmount += Number(g.price || 0) + Number(g.addOnsTotal || 0);
      });
    });

    const newDrafts: InvoiceItemDraft[] = [];

    Object.values(groups).forEach((grp) => {
      if (grp.totalAmount <= 0) return;
      const sUpper = grp.serviceName.toUpperCase();
      let consumption = 1.5;
      let fabricName = "Premium Fabric";
      let hsn = "5208";

      if (sUpper.includes("SHIRT")) {
        consumption = 1.6;
        fabricName = "Siyaram Shirting Fabric";
        hsn = "5208";
      } else if (sUpper.includes("PANT") || sUpper.includes("TROUSER")) {
        consumption = 1.25;
        fabricName = "Raymond Suiting Fabric";
        hsn = "5407";
      } else if (sUpper.includes("KURTA") || sUpper.includes("PAJAMA")) {
        consumption = 2.25;
        fabricName = "Fine Linen Kurta Fabric";
        hsn = "5210";
      } else if (sUpper.includes("COAT") || sUpper.includes("BLAZER") || sUpper.includes("SUIT")) {
        consumption = 2.0;
        fabricName = "Raymond Premium Suiting";
        hsn = "5407";
      }

      const totalMeters = Number((consumption * grp.count).toFixed(2));
      const taxable = Number((grp.totalAmount / 1.05).toFixed(2));
      const rate = totalMeters > 0 ? Number((taxable / totalMeters).toFixed(3)) : 0;

      newDrafts.push({
        itemType: "FABRIC",
        description: `${fabricName}${grp.count > 1 ? ` [${grp.count} ${grp.serviceName}s]` : ` [${grp.serviceName}]`}`,
        hsnSacCode: hsn,
        quantity: totalMeters,
        unit: "Mtr",
        rate: rate,
        discount: 0,
        gstRate: 5,
      });
    });

    setBundledFabricDrafts(newDrafts);
  }, [selectedOrdersData, selectedGarmentIds]);

  const updateBundledDraft = (index: number, field: keyof InvoiceItemDraft, val: any) => {
    const copy = [...bundledFabricDrafts];
    copy[index] = { ...copy[index], [field]: val };
    setBundledFabricDrafts(copy);
  };

  // Estimated Totals
  const estimatedTotals = useMemo(() => {
    let subtotal = 0;

    if (billingMode === "FABRIC_CONVERTED" && bundledFabricDrafts.length > 0) {
      bundledFabricDrafts.forEach((d) => {
        const taxable = d.quantity * d.rate;
        const total = taxable * 1.05;
        subtotal += total;
      });
    } else {
      selectedOrdersData.forEach((ord) => {
        ord.garments.forEach((g) => {
          if (selectedGarmentIds.length > 0 && !selectedGarmentIds.includes(g.garmentId)) {
            return;
          }
          subtotal += Number(g.price || 0) + Number(g.addOnsTotal || 0);
        });
      });
    }

    const netSubtotal = Math.max(0, subtotal - discountAmount);
    const avgGst = 5;
    let taxable = netSubtotal;
    let tax = 0;

    if (isTaxInclusive || billingMode === "FABRIC_CONVERTED") {
      taxable = netSubtotal / (1 + avgGst / 100);
      tax = netSubtotal - taxable;
    } else {
      tax = (taxable * avgGst) / 100;
    }

    const grandTotal = isTaxInclusive || billingMode === "FABRIC_CONVERTED" ? netSubtotal : taxable + tax;

    return {
      subtotal,
      discount: discountAmount,
      taxable,
      tax,
      grandTotal,
    };
  }, [selectedOrdersData, selectedGarmentIds, discountAmount, isTaxInclusive, billingMode, bundledFabricDrafts]);

  // Submit invoice generation
  const handleGenerateInvoice = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order to generate an invoice.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: GenerateInvoicePayload = {
        orderIds: selectedOrderIds,
        selectedGarmentIds: selectedGarmentIds.length > 0 ? selectedGarmentIds : undefined,
        invoiceType,
        isTaxInclusive: billingMode === "FABRIC_CONVERTED" ? true : isTaxInclusive,
        customerGstin: customerGstin.trim() || undefined,
        customerStateCode,
        placeOfSupply,
        discount: discountAmount > 0 ? discountAmount : undefined,
        paymentMethod,
        advancePaidAmount: advancePaidAmount > 0 ? advancePaidAmount : undefined,
        notes: notes.trim() || undefined,
        billingMode,
        overrideItems: billingMode === "FABRIC_CONVERTED" && bundledFabricDrafts.length > 0 ? bundledFabricDrafts : undefined,
        garmentCustomerFabricOverrides: Object.keys(garmentFabricOverrides).length > 0 ? garmentFabricOverrides : undefined,
      };

      const inv = await generateInvoice(payload);
      toast.success(`Invoice ${inv.invoiceNumber} generated successfully!`);
      setSelectedOrderIds([]);
      setSelectedGarmentIds([]);
      setDiscountAmount(0);
      setAdvancePaidAmount(0);
      loadOrders();
      onInvoiceCreated(inv);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "STITCHING_ONLY":
        return <Badge variant="secondary" className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">Stitching Only</Badge>;
      case "FABRIC_AND_STITCHING":
        return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Fabric + Stitching</Badge>;
      case "FABRIC_ONLY":
        return <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Fabric Only</Badge>;
      case "MIXED":
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Mixed Order</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Select Orders for Bill Generation
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Full control over which orders are billed. Convert to bundled 5% GST Fabric sales or bill as service.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllVisible}
                className="text-xs"
              >
                {selectedOrderIds.length === orders.length && orders.length > 0 ? (
                  <>
                    <Square className="w-3.5 h-3.5 mr-1.5" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                    Select All ({orders.length})
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={loadOrders}
                className="text-muted-foreground hover:text-foreground"
                title="Reload Orders"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Filters Grid */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search No, Phone, Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="relative">
              <Input
                placeholder="Customer Name..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <Select value={classificationFilter} onValueChange={(val) => setClassificationFilter(val || "ALL")}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classifications</SelectItem>
                  <SelectItem value="STITCHING_ONLY">Stitching Only</SelectItem>
                  <SelectItem value="FABRIC_AND_STITCHING">Fabric + Stitching</SelectItem>
                  <SelectItem value="FABRIC_ONLY">Fabric Only</SelectItem>
                  <SelectItem value="MIXED">Mixed Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={billingStatusFilter} onValueChange={(val) => setBillingStatusFilter(val || "ALL")}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Billing Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Billing Statuses</SelectItem>
                  <SelectItem value="UNBILLED">Unbilled Only</SelectItem>
                  <SelectItem value="BILLED">Already Billed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={paymentStatusFilter} onValueChange={(val) => setPaymentStatusFilter(val || "ALL")}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payment Statuses</SelectItem>
                  <SelectItem value="PAID">Fully Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-9"
                title="Start Date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-9"
                title="End Date"
              />
              <Button type="submit" size="sm" variant="secondary" className="px-3">
                <Search className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Grid: Orders on Left, Configuration & Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Eligible Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Available Orders</span>
                <span className="text-xs text-muted-foreground">({orders.length} orders found)</span>
              </div>
              <div className="text-xs text-primary font-medium">
                {selectedOrderIds.length} orders selected
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading eligible orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  No orders match the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.orderId);
                    const isExpanded = expandedOrderIds.includes(order.orderId);

                    return (
                      <div
                        key={order.orderId}
                        className={`transition-colors ${
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                        }`}
                      >
                        {/* Order Header Row */}
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectOrder(order.orderId)}
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-primary">
                                  #{order.orderId}
                                </span>
                                {order.sampleBookPageNumber && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                    P.{order.sampleBookPageNumber}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-foreground">
                                  {order.customerName}
                                </span>
                                {order.customerPhone && (
                                  <span className="text-[11px] text-muted-foreground">
                                    ({order.customerPhone})
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span>Date: {order.orderDate}</span>
                                <span>•</span>
                                <span>{order.garmentsCount} Garments</span>
                                <span>•</span>
                                <span>{order.servicesSummary}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-xs font-mono text-foreground">
                                ₹{order.totalOrderAmount.toFixed(2)}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                {getClassificationBadge(order.classification)}
                                {order.billingStatus === "BILLED" ? (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                                    Billed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    Unbilled
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandOrder(order.orderId)}
                              className="h-7 w-7 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Garment Breakdown Drawer */}
                        {isExpanded && (
                          <div className="bg-muted/40 border-t border-border px-4 py-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground font-medium text-[11px]">
                              <span>Order Garments ({order.garments.length})</span>
                              <span>Select individual garments for split billing</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {order.garments.map((g) => {
                                const isGSelected = selectedGarmentIds.includes(g.garmentId);
                                const effectiveCustomerFabric = garmentFabricOverrides[g.garmentId] !== undefined
                                  ? garmentFabricOverrides[g.garmentId]
                                  : (!g.hasShopFabric && g.customerFabric);
                                const fabricPortion = g.fabricAmount && g.fabricAmount > 0
                                  ? g.fabricAmount
                                  : (g.serviceBasePrice && g.price > g.serviceBasePrice ? g.price - g.serviceBasePrice : 0);

                                return (
                                  <div
                                    key={g.garmentId}
                                    onClick={() => toggleSelectGarment(g.garmentId, order.orderId)}
                                    className={`p-2.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-colors gap-2 ${
                                      isGSelected
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-border bg-card hover:bg-muted/40"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2">
                                        <Checkbox
                                          checked={isGSelected}
                                          onCheckedChange={() => toggleSelectGarment(g.garmentId, order.orderId)}
                                          className="mt-0.5"
                                        />
                                        <div>
                                          <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                            <span>{g.serviceName}</span>
                                            {g.sampleNumber && (
                                              <span className="text-[10px] text-muted-foreground font-normal">
                                                [Sample {g.sampleNumber}]
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                                            {!effectiveCustomerFabric ? (
                                              <span className="text-amber-700 dark:text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                🧵 Shop Fabric {fabricPortion > 0 ? `(₹${fabricPortion.toFixed(0)})` : ""} • Stitching (₹{(g.stitchingAmount ?? (g.price - fabricPortion) + g.addOnsTotal).toFixed(0)})
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                                                ✂️ Customer Cloth (Stitching Only)
                                              </span>
                                            )}
                                            {g.addOnsCount > 0 && (
                                              <span>• {g.addOnsCount} Add-on (+₹{g.addOnsTotal})</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="font-mono text-xs font-bold text-foreground text-right whitespace-nowrap">
                                        ₹{(g.price + g.addOnsTotal).toFixed(2)}
                                      </div>
                                    </div>

                                    {/* Direct Interactive Fabric Source Toggle in Billing */}
                                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[11px]">
                                      <span className="text-[10px] text-muted-foreground font-medium">Fabric Source:</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleGarmentFabricSource(order.orderId, g.garmentId, true);
                                          }}
                                          className={`px-2 py-0.5 text-[10px] rounded font-medium transition-all border flex items-center gap-1 ${
                                            effectiveCustomerFabric
                                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                                              : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                                          }`}
                                          title="Mark as customer-provided cloth (stitching only)"
                                        >
                                          ✂️ Customer Cloth
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleGarmentFabricSource(order.orderId, g.garmentId, false);
                                          }}
                                          className={`px-2 py-0.5 text-[10px] rounded font-medium transition-all border flex items-center gap-1 ${
                                            !effectiveCustomerFabric
                                              ? "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500 shadow-xs font-bold"
                                              : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                                          }`}
                                          title="Mark as showroom fabric included"
                                        >
                                          🧵 Shop Fabric {fabricPortion > 0 ? `(+₹${fabricPortion.toFixed(0)})` : ""}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Invoice Configuration & Mode Panel */}
        <div className="space-y-4">
          <Card className="border-border bg-card shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                <span>Invoice Configuration</span>
                <Badge variant="secondary" className="font-mono">
                  {selectedOrderIds.length} Orders
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Choose billing mode & review calculation preview
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Billing Mode Segmented Switch */}
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Billing Presentation Mode
                </Label>
                <div className="grid grid-cols-1 gap-1.5 bg-muted p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setBillingMode("FABRIC_CONVERTED")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      billingMode === "FABRIC_CONVERTED"
                        ? "bg-background text-foreground shadow-sm font-bold border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Bill as Fabric Sale (5% GST)
                    </span>
                    <Badge variant="secondary" className="text-[9px] bg-emerald-500/15 text-emerald-600">
                      Recommended
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingMode("GARMENT_CONSOLIDATED")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      billingMode === "GARMENT_CONSOLIDATED"
                        ? "bg-background text-foreground shadow-sm font-bold border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-blue-500" />
                      Consolidated Garments (1 Line/Garment)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingMode("DETAILED_ITEMIZED")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      billingMode === "DETAILED_ITEMIZED"
                        ? "bg-background text-foreground shadow-sm font-bold border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      Detailed Breakdown (Micro Add-ons)
                    </span>
                  </button>
                </div>
              </div>

              {/* Document Type & Pricing Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">Bill Type</Label>
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
                  <Label className="text-[11px] text-muted-foreground font-semibold">Pricing Mode</Label>
                  <div className="flex bg-muted rounded-md p-1 border border-border mt-1">
                    <button
                      type="button"
                      onClick={() => setIsTaxInclusive(true)}
                      className={`flex-1 text-[11px] py-1 rounded font-medium transition-all ${
                        isTaxInclusive ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground"
                      }`}
                    >
                      Inclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTaxInclusive(false)}
                      disabled={billingMode === "FABRIC_CONVERTED"}
                      className={`flex-1 text-[11px] py-1 rounded font-medium transition-all ${
                        !isTaxInclusive && billingMode !== "FABRIC_CONVERTED"
                          ? "bg-background text-foreground shadow-sm font-bold"
                          : "text-muted-foreground opacity-60"
                      }`}
                    >
                      Exclusive
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold">Customer GSTIN (Optional B2B)</Label>
                <Input
                  placeholder="e.g. 08AAAAA0000A1Z5"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="text-xs font-mono mt-1 uppercase"
                />
              </div>

              {/* Dynamic Bundled Fabric Lines (when in FABRIC_CONVERTED mode) */}
              {billingMode === "FABRIC_CONVERTED" && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      Fabric Lines on Invoice (5% GST)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Editable descriptions & meters</span>
                  </div>

                  {bundledFabricDrafts.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-1">
                      Select orders on the left to see auto-bundled fabric lines.
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                      {bundledFabricDrafts.map((draft, idx) => (
                        <div key={idx} className="bg-card p-2 rounded border border-border space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <Input
                              value={draft.description}
                              onChange={(e) => updateBundledDraft(idx, "description", e.target.value)}
                              className="h-7 text-xs font-medium"
                              placeholder="Fabric Name / Brand"
                            />
                            <Badge variant="outline" className="font-mono text-[10px] whitespace-nowrap">
                              HSN {draft.hsnSacCode}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground font-mono">
                            <div>
                              <span>Meters:</span>
                              <Input
                                type="number"
                                step="0.05"
                                value={draft.quantity}
                                onChange={(e) => {
                                  const meters = Number(e.target.value);
                                  const total = draft.quantity * draft.rate * 1.05;
                                  const taxable = total / 1.05;
                                  const rate = meters > 0 ? Number((taxable / meters).toFixed(3)) : 0;
                                  const copy = [...bundledFabricDrafts];
                                  copy[idx] = { ...copy[idx], quantity: meters, rate };
                                  setBundledFabricDrafts(copy);
                                }}
                                className="h-6 text-[11px] font-mono mt-0.5"
                              />
                            </div>
                            <div>
                              <span>Rate/Mtr:</span>
                              <div className="h-6 flex items-center font-bold text-foreground">
                                ₹{draft.rate.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span>Inc. Total:</span>
                              <div className="h-6 flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{(draft.quantity * draft.rate * 1.05).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settlement & Advance Details */}
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "CASH")}>
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / QR</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">Settled Now (₹)</Label>
                  <Input
                    type="number"
                    value={advancePaidAmount}
                    onChange={(e) => setAdvancePaidAmount(Number(e.target.value))}
                    className="text-xs font-mono mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold">Invoice Notes / Remarks</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional customer notes or instructions..."
                  rows={2}
                  className="text-xs mt-1 resize-none"
                />
              </div>

              {/* Financial Totals Box */}
              <div className="bg-muted/60 p-3.5 rounded-lg border border-border space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-foreground font-medium">₹{estimatedTotals.subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxable Value:</span>
                  <span className="font-mono text-foreground font-medium">₹{estimatedTotals.taxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%):</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">+₹{estimatedTotals.tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-border pt-2 flex justify-between text-sm font-black text-foreground">
                  <span>Invoice Grand Total:</span>
                  <span className="font-mono text-primary text-base">₹{estimatedTotals.grandTotal.toFixed(2)}</span>
                </div>

                {advancePaidAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground pt-1 text-[11px]">
                    <span>Balance Due:</span>
                    <span className="font-mono text-destructive font-bold">
                      ₹{Math.max(0, estimatedTotals.grandTotal - advancePaidAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={handleGenerateInvoice}
                disabled={isSubmitting || selectedOrderIds.length === 0}
                className="w-full h-10 shadow-md font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Sequential Bill...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate & Print Bill ({selectedOrderIds.length} Selected)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
