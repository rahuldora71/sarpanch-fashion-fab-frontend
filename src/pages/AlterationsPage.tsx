import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Scissors,
  Search,
  User,
  ShoppingBag,
  Calendar,
  Copy,
  Layers,
  ChevronRight,
  Save,
  RotateCcw,
  Info,
  CheckSquare,
  Square,
  TrendingDown,
  TrendingUp,
  Phone,
  BadgeCheck,
  Loader2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

import AlterationQueueView from "@/components/alterations/AlterationQueueView";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { searchCustomers, getCustomerProfile } from "@/services/CustomerService";
import { orderService } from "@/services/orderService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import { alterationService } from "@/services/alterationService";

import type { CustomerSummary, CustomerProfileResponse } from "@/models/Customer";
import type { OrderDetailsResponse } from "@/types/order";
import type {
  AdjustmentType,
  FieldAlterationConfig,
  GarmentAlterationItem,
} from "@/types/alteration";

export default function AlterationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Params for deep-linking
  const urlCustomerId = searchParams.get("customerId");
  const urlOrderId = searchParams.get("orderId");
  const tabParam = searchParams.get("tab");

  // View Mode: Alterations Queue vs New Alteration
  const [viewMode, setViewMode] = useState<"queue" | "new">(
    urlCustomerId || tabParam === "new" ? "new" : "queue"
  );

  // Step 1: Customer Search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerResults, setCustomerResults] = useState<CustomerSummary[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Step 2: Customer Profile & Orders state
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileResponse | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Step 3: Order Details & Garments state
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Field definitions from global cache
  const { fieldMap: fieldDefs, getFieldName, getFieldUnit } = useMeasurementFields();

  // Step 4: Garments & Alterations Work State
  const [garmentItems, setGarmentItems] = useState<GarmentAlterationItem[]>([]);
  const [activeGarmentId, setActiveGarmentId] = useState<number | null>(null);

  // Step 5: Overall Alteration Settings
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split("T")[0];
  });
  const [overallNote, setOverallNote] = useState<string>("");
  const [updateCustomerDefaults, setUpdateCustomerDefaults] = useState<boolean>(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);

  // Handle URL deep-linking
  useEffect(() => {
    if (urlCustomerId && !selectedCustomer) {
      getCustomerProfile(Number(urlCustomerId))
        .then((profile) => {
          setSelectedCustomer(profile.customer);
          setCustomerProfile(profile);
          if (urlOrderId) {
            setSelectedOrderId(Number(urlOrderId));
          }
        })
        .catch((err) => console.error("Failed to load customer profile from URL:", err));
    }
  }, [urlCustomerId, urlOrderId]);

  // Debounced customer search
  useEffect(() => {
    if (!customerSearch.trim() || selectedCustomer) {
      setCustomerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const res = await searchCustomers(customerSearch.trim(), 0, 8);
        setCustomerResults(res.content);
      } catch (err) {
        console.error("Customer search error:", err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer]);

  // Fetch customer profile & orders when customer is selected
  const handleSelectCustomer = async (cust: CustomerSummary) => {
    setSelectedCustomer(cust);
    setCustomerResults([]);
    setCustomerSearch("");
    setLoadingOrders(true);
    setSelectedOrderId(null);
    setOrderDetails(null);
    setGarmentItems([]);
    setActiveGarmentId(null);

    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("customerId", String(cust.id));
      p.delete("orderId");
      return p;
    });

    try {
      const profile = await getCustomerProfile(cust.id);
      setCustomerProfile(profile);
    } catch (err) {
      console.error("Failed to fetch customer profile:", err);
      toast.error("Failed to load customer orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerProfile(null);
    setSelectedOrderId(null);
    setOrderDetails(null);
    setGarmentItems([]);
    setActiveGarmentId(null);
    setSearchParams({});
  };

  // Fetch order details when order is selected
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetails(null);
      setGarmentItems([]);
      setActiveGarmentId(null);
      return;
    }

    setLoadingOrderDetails(true);
    orderService
      .getOrderDetails(selectedOrderId)
      .then((details) => {
        setOrderDetails(details);

        // Build GarmentAlterationItem list
        const items: GarmentAlterationItem[] = details.garments.map((g, idx) => {
          const fieldsMap: Record<number, FieldAlterationConfig> = {};

          if (g.measurement && g.measurement.measurementFields) {
            Object.entries(g.measurement.measurementFields).forEach(([k, v]) => {
              const fieldId = Number(k);
              const rawVal = v as any;
              const numVal: number | string =
                typeof rawVal === "number"
                  ? rawVal
                  : typeof rawVal === "string" && !isNaN(Number(rawVal)) && rawVal.trim() !== ""
                  ? Number(rawVal)
                  : String(rawVal ?? "");
              const finalVal: number | string =
                typeof numVal === "number" ? numVal - 0.5 : numVal;
              fieldsMap[fieldId] = {
                fieldId,
                fieldName: getFieldName(fieldId),
                unit: getFieldUnit(fieldId, "in"),
                originalValue: numVal,
                adjustmentType: "TIGHTEN",
                delta: 0.5,
                finalValue: finalVal,
                applied: false,
              };
            });
          }

          return {
            garmentId: g.garmentId,
            serviceId: g.serviceId,
            serviceName: g.serviceName,
            sampleNumber: g.sampleNumber,
            currentStatus: g.status,
            selected: idx === 0, // select first garment by default
            fields: fieldsMap,
            alterationNote: g.note || "",
            alterationDeliveryDate: details.orderDate,
          };
        });

        setGarmentItems(items);
        if (items.length > 0) {
          setActiveGarmentId(items[0].garmentId);
        }
      })
      .catch((err) => {
        console.error("Failed to load order details:", err);
        toast.error("Failed to load order garments.");
      })
      .finally(() => {
        setLoadingOrderDetails(false);
      });
  }, [selectedOrderId, fieldDefs]);

  // Active garment object
  const activeGarment = useMemo(() => {
    return garmentItems.find((g) => g.garmentId === activeGarmentId) || null;
  }, [garmentItems, activeGarmentId]);

  // Count of matching service garments in this order
  const matchingServiceCount = useMemo(() => {
    if (!activeGarment) return 0;
    return garmentItems.filter((g) => g.serviceId === activeGarment.serviceId).length;
  }, [activeGarment, garmentItems]);

  // Toggle garment selection
  const handleToggleGarmentSelection = (garmentId: number) => {
    setGarmentItems((prev) =>
      prev.map((g) => (g.garmentId === garmentId ? { ...g, selected: !g.selected } : g))
    );
  };

  // Select all garments of a service
  const handleSelectAllService = (serviceId: number, select: boolean) => {
    setGarmentItems((prev) =>
      prev.map((g) => (g.serviceId === serviceId ? { ...g, selected: select } : g))
    );
    toast.success(
      select ? `Selected all matching garments` : `Deselected matching garments`
    );
  };

  // Toggle field alteration applied
  const handleToggleFieldApplied = (garmentId: number, fieldId: number) => {
    setGarmentItems((prev) =>
      prev.map((g) => {
        if (g.garmentId !== garmentId) return g;
        const currentField = g.fields[fieldId];
        if (!currentField) return g;

        return {
          ...g,
          selected: true, // auto-select garment when field is enabled
          fields: {
            ...g.fields,
            [fieldId]: {
              ...currentField,
              applied: !currentField.applied,
            },
          },
        };
      })
    );
  };

  // Update adjustment type or delta
  const handleUpdateFieldAdjustment = (
    garmentId: number,
    fieldId: number,
    updates: Partial<FieldAlterationConfig>
  ) => {
    setGarmentItems((prev) =>
      prev.map((g) => {
        if (g.garmentId !== garmentId) return g;
        const field = g.fields[fieldId];
        if (!field) return g;

        const updated: FieldAlterationConfig = { ...field, ...updates };

        // Recalculate final value
        const origNum = Number(updated.originalValue);
        if (!isNaN(origNum)) {
          if (updated.adjustmentType === "TIGHTEN") {
            updated.finalValue = +(origNum - (updated.delta || 0)).toFixed(2);
          } else if (updated.adjustmentType === "LOOSEN") {
            updated.finalValue = +(origNum + (updated.delta || 0)).toFixed(2);
          } else if (updated.adjustmentType === "SET") {
            updated.finalValue =
              updated.customValue !== undefined ? updated.customValue : origNum;
          }
        }

        return {
          ...g,
          selected: true,
          fields: {
            ...g.fields,
            [fieldId]: updated,
          },
        };
      })
    );
  };

  // Quick delta button clicks (-0.25, -0.5, -1, +0.25, +0.5, +1)
  const handleQuickDeltaClick = (
    garmentId: number,
    fieldId: number,
    type: AdjustmentType,
    delta: number
  ) => {
    handleUpdateFieldAdjustment(garmentId, fieldId, {
      adjustmentType: type,
      delta: delta,
      applied: true,
    });
  };

  // ============================================================
  // CORE FEATURE: COPY ALTERATION CONFIG TO ALL MATCHING SERVICES
  // ============================================================
  const handleCopyAlterationsToSameServices = () => {
    if (!activeGarment) return;

    // Collect all active alterations from current garment
    const activeAppliedFields = Object.entries(activeGarment.fields).filter(
      ([_, f]) => f.applied
    );

    if (activeAppliedFields.length === 0) {
      toast.error(
        `Please select and configure at least one alteration on ${activeGarment.serviceName} first.`
      );
      return;
    }

    const targetServiceId = activeGarment.serviceId;
    let copiedCount = 0;

    setGarmentItems((prev) =>
      prev.map((g) => {
        if (g.serviceId !== targetServiceId) return g;

        copiedCount++;
        const newFields = { ...g.fields };

        // Apply every alteration configuration from activeGarment
        activeAppliedFields.forEach(([fIdStr, sourceField]) => {
          const fId = Number(fIdStr);
          const targetField = newFields[fId];

          if (targetField) {
            const origNum = Number(targetField.originalValue);
            let finalVal: number | string = targetField.originalValue;

            if (!isNaN(origNum)) {
              if (sourceField.adjustmentType === "TIGHTEN") {
                finalVal = +(origNum - (sourceField.delta || 0)).toFixed(2);
              } else if (sourceField.adjustmentType === "LOOSEN") {
                finalVal = +(origNum + (sourceField.delta || 0)).toFixed(2);
              } else if (sourceField.adjustmentType === "SET") {
                finalVal = sourceField.customValue ?? origNum;
              }
            }

            newFields[fId] = {
              ...targetField,
              adjustmentType: sourceField.adjustmentType,
              delta: sourceField.delta,
              customValue: sourceField.customValue,
              finalValue: finalVal,
              applied: true,
            };
          }
        });

        return {
          ...g,
          selected: true,
          fields: newFields,
          alterationNote: g.alterationNote || activeGarment.alterationNote,
        };
      })
    );

    toast.success(
      `Copied ${activeAppliedFields.length} alteration settings to all ${matchingServiceCount} ${activeGarment.serviceName}(s)!`
    );
  };

  // Selected garments count and total alterations
  const selectedGarmentsList = useMemo(() => {
    return garmentItems.filter((g) => g.selected);
  }, [garmentItems]);

  const totalAlteredFieldsCount = useMemo(() => {
    return garmentItems.reduce((acc, g) => {
      if (!g.selected) return acc;
      const count = Object.values(g.fields).filter((f) => f.applied).length;
      return acc + count;
    }, 0);
  }, [garmentItems]);

  // Submit alterations
  const handleSubmitAlterations = async () => {
    if (!selectedCustomer || !orderDetails) {
      toast.error("Please select a customer and an order.");
      return;
    }

    if (selectedGarmentsList.length === 0) {
      toast.error("Please select at least one garment to alter.");
      return;
    }

    if (totalAlteredFieldsCount === 0) {
      toast.error("Please configure at least one field adjustment to alter.");
      return;
    }

    setSubmitting(true);
    try {
      const garmentAlterationsPayload = selectedGarmentsList.map((g) => {
        const updatedFields: Record<string, any> = {};
        const alterationDeltas: Record<string, any> = {};

        // Merge original fields with any updated ones
        Object.values(g.fields).forEach((f) => {
          if (f.applied) {
            updatedFields[String(f.fieldId)] = f.finalValue;
            if (f.adjustmentType === "TIGHTEN") {
              alterationDeltas[String(f.fieldId)] = -Math.abs(f.delta);
            } else if (f.adjustmentType === "LOOSEN") {
              alterationDeltas[String(f.fieldId)] = Math.abs(f.delta);
            } else {
              alterationDeltas[String(f.fieldId)] = f.finalValue;
            }
          } else {
            updatedFields[String(f.fieldId)] = f.originalValue;
          }
        });

        return {
          garmentId: g.garmentId,
          serviceId: g.serviceId,
          alterationNote: g.alterationNote.trim() || overallNote.trim() || undefined,
          alterationDeliveryDate: deliveryDate || undefined,
          updatedMeasurementFields: updatedFields,
          alterationDeltas,
        };
      });

      const payload = {
        orderId: orderDetails.orderId,
        customerId: selectedCustomer.id,
        deliveryDate,
        overallNote: overallNote.trim() || undefined,
        updateCustomerDefaultMeasurements: updateCustomerDefaults,
        garmentAlterations: garmentAlterationsPayload,
      };

      const res = await alterationService.submitBatchAlterations(payload);

      toast.success(
        `Success! ${res.alteredGarmentsCount} garment(s) updated to ALTERATION status.`
      );

      if (res.customerDefaultUpdated) {
        toast(
          `Customer's default measurements updated for future orders.`,
          { icon: "✨" }
        );
      }

      // Reset and switch to Alteration Queue view
      handleClearCustomer();
      setViewMode("queue");
    } catch (err: any) {
      console.error("Alteration submission failed:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit alterations. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl animate-in fade-in-50 duration-300">
      {/* ================= TOP NAVIGATION TABS ================= */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          variant={viewMode === "queue" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setViewMode("queue");
            setSearchParams({});
          }}
          className="gap-2 text-xs sm:text-sm font-semibold h-9 rounded-lg"
        >
          <Clock className="h-4 w-4" />
          Alteration Queue & Deliveries
        </Button>
        <Button
          variant={viewMode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("new")}
          className="gap-2 text-xs sm:text-sm font-semibold h-9 rounded-lg"
        >
          <Scissors className="h-4 w-4" />
          Record New Alteration
        </Button>
      </div>

      {viewMode === "queue" ? (
        <AlterationQueueView onNewAlteration={() => setViewMode("new")} />
      ) : (
        <div className="space-y-6">
          {/* ================= PAGE HEADER ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("queue")}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
                </Button>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/20">
                  <Scissors className="h-5 w-5" />
                </div>
                Record New Alteration
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Search customer, choose garments, configure tighten/loosen fit deltas, batch-copy across identical garments, and update future measurements
              </p>
            </div>

            {selectedCustomer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCustomer}
                className="gap-1.5 self-start sm:self-auto text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Selection
              </Button>
            )}
          </div>

      {/* ================= STEP 1: CUSTOMER SELECTION ================= */}
      {!selectedCustomer ? (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Step 1: Select Customer
            </CardTitle>
            <CardDescription className="text-xs">
              Search by customer name, phone number, or customer code to locate their order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone (e.g. 9876543210), or code (e.g. CUST-001)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 h-10 text-sm"
                autoFocus
              />
              {searchingCustomer && (
                <div className="absolute right-3 top-3 text-xs text-muted-foreground animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {customerResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {customerResults.map((cust) => (
                  <Card
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="cursor-pointer border-border/80 hover:border-primary hover:shadow-sm transition-all p-3 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground group-hover:text-primary truncate">
                          {cust.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {cust.customerCode && (
                            <span className="font-mono bg-muted px-1.5 py-0.2 rounded text-[11px]">
                              {cust.customerCode}
                            </span>
                          )}
                          {cust.phone && <span>{cust.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Selected Customer Banner */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.customerCode && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedCustomer.customerCode}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                {selectedCustomer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedCustomer.phone}
                  </span>
                )}
                <span>•</span>
                <span>Customer #{selectedCustomer.id}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCustomer}
            className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto h-8"
          >
            Change Customer
          </Button>
        </div>
      )}

      {/* ================= STEP 2: ORDER SELECTION ================= */}
      {selectedCustomer && !selectedOrderId && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Step 2: Select Order to Alter
            </CardTitle>
            <CardDescription className="text-xs">
              Choose which customer order contains the garments requiring alteration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading customer orders...
              </div>
            ) : !customerProfile || customerProfile.orders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No orders found for this customer.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customerProfile.orders.map((ord) => (
                  <Card
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      setSearchParams((prev) => {
                        const p = new URLSearchParams(prev);
                        p.set("orderId", String(ord.id));
                        return p;
                      });
                    }}
                    className="cursor-pointer border-border/80 hover:border-primary hover:shadow-sm transition-all p-4 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          #{ord.id}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({ord.orderNumber})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {ord.orderDate}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {ord.garments.length} garment{ord.garments.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1 border-t border-border/60 pt-2.5">
                      {ord.garments.map((g) => (
                        <span
                          key={g.id}
                          className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px]"
                        >
                          {g.serviceName}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order loading indicator */}
      {selectedCustomer && selectedOrderId && loadingOrderDetails && (
        <Card className="border-border">
          <CardContent className="py-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading garments and measurements for Order #{selectedOrderId}…
          </CardContent>
        </Card>
      )}

      {/* ================= STEP 3 & 4: GARMENT SELECTION & ALTERATION WORKSPACE ================= */}
      {selectedCustomer && selectedOrderId && orderDetails && !loadingOrderDetails && (
        <div className="space-y-6">
          {/* Active Order Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                #{orderDetails.orderId}
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  Order #{orderDetails.orderId}
                </span>{" "}
                <span className="text-muted-foreground">placed on {orderDetails.orderDate}</span>
                <span className="mx-2 text-border">|</span>
                <span className="text-muted-foreground">
                  {orderDetails.garments.length} total garments
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOrderId(null);
                setOrderDetails(null);
                setGarmentItems([]);
              }}
              className="text-xs h-7"
            >
              Switch Order
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Garments List in Order (col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> Garments in Order
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {selectedGarmentsList.length} of {garmentItems.length} selected
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Select garments requiring alteration adjustments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-3 pt-0">
                  {garmentItems.map((g) => {
                    const isSelected = g.selected;
                    const isActive = g.garmentId === activeGarmentId;
                    const appliedCount = Object.values(g.fields).filter((f) => f.applied).length;

                    return (
                      <div
                        key={g.garmentId}
                        onClick={() => setActiveGarmentId(g.garmentId)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2 ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-xs"
                            : isSelected
                            ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                            : "border-border hover:border-border/80 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGarmentSelection(g.garmentId);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                            <span className="font-bold text-xs text-foreground truncate">
                              {g.serviceName}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              #{g.garmentId}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {appliedCount > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] py-0 px-1.5 font-bold"
                              >
                                {appliedCount} altered
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              {g.currentStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Quick Action to Select all of this service */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>
                            {Object.keys(g.fields).length} measurement fields
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllService(g.serviceId, true);
                            }}
                            className="text-primary hover:underline font-medium text-[11px]"
                          >
                            Select all {g.serviceName}s
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Order Alteration Global Settings */}
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Delivery & Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Expected Alteration Delivery Date</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Overall Alteration Reason / Note</Label>
                    <Textarea
                      placeholder="e.g. Customer trial fitting: tighten waist and chest by 0.5 inch..."
                      value={overallNote}
                      onChange={(e) => setOverallNote(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateCustomerDefaults}
                        onChange={(e) => setUpdateCustomerDefaults(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="text-xs">
                        <strong className="text-foreground block">
                          Update customer's default measurements
                        </strong>
                        <span className="text-muted-foreground text-[11px] leading-tight block mt-0.5">
                          When checked, any future orders for this customer will automatically pre-fill with these new altered measurements.
                        </span>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Active Garment Measurement Adjuster (col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              {activeGarment ? (
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                            Fitting Editor: {activeGarment.serviceName}
                          </CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            Garment #{activeGarment.garmentId}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-0.5">
                          Select the fields to alter, then choose whether to tighten (-) or loosen (+) the garment
                        </CardDescription>
                      </div>

                      {/* ============================================================
                          THE BATCH COPY BUTTON (FEATURE REQUEST)
                          ============================================================ */}
                      {matchingServiceCount > 1 && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={handleCopyAlterationsToSameServices}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-sm font-semibold shrink-0"
                          title={`Copy these alterations to all ${matchingServiceCount} ${activeGarment.serviceName}s in this order`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy to All {activeGarment.serviceName}s ({matchingServiceCount})
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Guidance Alert Banner */}
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">How Alteration Works:</strong> Check any field you want to modify. Choose <strong>Tighten (-)</strong> to reduce size (e.g. -0.5") or <strong>Loosen (+)</strong> to expand size (e.g. +0.5"). Use the quick chips for instant adjustment. You can copy these adjustments to all other matching garments with one click!
                      </div>
                    </div>

                    {/* Fields List */}
                    <div className="space-y-3">
                      {Object.values(activeGarment.fields).length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          No measurement fields found on this garment.
                        </div>
                      ) : (
                        Object.values(activeGarment.fields).map((field) => {
                          const isApplied = field.applied;

                          return (
                            <div
                              key={field.fieldId}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isApplied
                                  ? "border-orange-500/50 bg-gradient-to-r from-orange-50/20 to-background dark:from-orange-950/20 shadow-xs"
                                  : "border-border/70 hover:border-border bg-card"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Field Name & Original Value */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isApplied}
                                    onChange={() =>
                                      handleToggleFieldApplied(
                                        activeGarment.garmentId,
                                        field.fieldId
                                      )
                                    }
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                      {field.fieldName}
                                      {field.unit && (
                                        <span className="text-xs font-normal text-muted-foreground">
                                          ({field.unit})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Current Size:{" "}
                                      <strong className="font-semibold text-foreground font-mono">
                                        {field.originalValue} {field.unit}
                                      </strong>
                                    </div>
                                  </div>
                                </div>

                                {/* Active Controls when Applied */}
                                {isApplied ? (
                                  <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                                    {/* Action Selector: Tighten / Loosen / Set */}
                                    <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateFieldAdjustment(
                                            activeGarment.garmentId,
                                            field.fieldId,
                                            { adjustmentType: "TIGHTEN" }
                                          )
                                        }
                                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                          field.adjustmentType === "TIGHTEN"
                                            ? "bg-rose-600 text-white shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                      >
                                        <TrendingDown className="h-3 w-3" />
                                        Tighten (-)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateFieldAdjustment(
                                            activeGarment.garmentId,
                                            field.fieldId,
                                            { adjustmentType: "LOOSEN" }
                                          )
                                        }
                                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                          field.adjustmentType === "LOOSEN"
                                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                      >
                                        <TrendingUp className="h-3 w-3" />
                                        Loosen (+)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateFieldAdjustment(
                                            activeGarment.garmentId,
                                            field.fieldId,
                                            { adjustmentType: "SET" }
                                          )
                                        }
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          field.adjustmentType === "SET"
                                            ? "bg-blue-600 text-white shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                      >
                                        Set Value
                                      </button>
                                    </div>

                                    {/* Delta Input & Quick Chips */}
                                    {field.adjustmentType !== "SET" ? (
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={field.delta}
                                            onChange={(e) =>
                                              handleUpdateFieldAdjustment(
                                                activeGarment.garmentId,
                                                field.fieldId,
                                                { delta: Math.abs(parseFloat(e.target.value) || 0) }
                                              )
                                            }
                                            className="h-8 w-20 text-xs font-mono font-bold text-center"
                                          />
                                          <span className="text-xs text-muted-foreground">{field.unit}</span>
                                        </div>

                                        {/* Quick chips */}
                                        <div className="hidden sm:flex items-center gap-1">
                                          {[0.25, 0.5, 0.75, 1.0].map((quickD) => (
                                            <button
                                              key={quickD}
                                              type="button"
                                              onClick={() =>
                                                handleQuickDeltaClick(
                                                  activeGarment.garmentId,
                                                  field.fieldId,
                                                  field.adjustmentType,
                                                  quickD
                                                )
                                              }
                                              className={`h-7 px-1.5 text-[11px] rounded border font-mono transition-colors ${
                                                field.delta === quickD
                                                  ? "bg-primary text-primary-foreground font-bold border-primary"
                                                  : "border-border hover:bg-muted text-muted-foreground"
                                              }`}
                                            >
                                              {quickD}"
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          step="0.25"
                                          value={field.finalValue}
                                          onChange={(e) =>
                                            handleUpdateFieldAdjustment(
                                              activeGarment.garmentId,
                                              field.fieldId,
                                              {
                                                customValue: parseFloat(e.target.value) || 0,
                                                finalValue: parseFloat(e.target.value) || 0,
                                              }
                                            )
                                          }
                                          className="h-8 w-24 text-xs font-mono font-bold text-center"
                                        />
                                        <span className="text-xs text-muted-foreground">{field.unit}</span>
                                      </div>
                                    )}

                                    {/* Resulting Final Value Highlight */}
                                    <div className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-lg">
                                      <span className="text-[11px] text-muted-foreground font-medium">
                                        Target:
                                      </span>
                                      <span
                                        className={`font-mono text-sm font-extrabold ${
                                          field.adjustmentType === "TIGHTEN"
                                            ? "text-rose-600 dark:text-rose-400"
                                            : field.adjustmentType === "LOOSEN"
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-blue-600 dark:text-blue-400"
                                        }`}
                                      >
                                        {field.finalValue} {field.unit}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleFieldApplied(
                                        activeGarment.garmentId,
                                        field.fieldId
                                      )
                                    }
                                    className="text-xs h-7 self-start sm:self-auto gap-1 text-muted-foreground hover:text-foreground"
                                  >
                                    <Scissors className="h-3 w-3" />
                                    Alter Field
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
                    <div className="text-xs text-muted-foreground">
                      {Object.values(activeGarment.fields).filter((f) => f.applied).length} field(s) configured for alteration on this {activeGarment.serviceName}.
                    </div>

                    {matchingServiceCount > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyAlterationsToSameServices}
                        className="text-xs gap-1.5 font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Apply to All {matchingServiceCount} {activeGarment.serviceName}s
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  Please select a garment from the left to configure fitting adjustments.
                </div>
              )}

              {/* Summary and Submit Bar */}
              <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      Ready to Submit Alterations
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedGarmentsList.length} garment(s) selected with a total of {totalAlteredFieldsCount} measurement adjustment(s).
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="default"
                    onClick={handleSubmitAlterations}
                    disabled={submitting || selectedGarmentsList.length === 0 || totalAlteredFieldsCount === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 shadow-md shadow-emerald-600/20"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Saving Alterations..." : `Confirm & Save Alterations`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
