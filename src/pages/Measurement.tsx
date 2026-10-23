import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TakeMeasurementDialog } from "@/components/measurements/TakeMeasurementDialog";
import { MeasurementDetailsDialog } from "@/components/measurements/MeasurementDetailsDialog";

import { getAllMeasurements } from "@/services/measurementService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import { getActiveServices } from "@/services/serviceService";

import type {
  MeasurementResponse,
} from "@/types/measurement";
import type { Service } from "@/types/service";

const PAGE_SIZE = 15;

const formatDisplayDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getTodayString = () => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
};

export default function MeasurementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const customerIdParam = searchParams.get("customerId");
  const openNewParam = searchParams.get("new");

  // Measurements list state
  const [measurements, setMeasurements] = useState<MeasurementResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "walkin" | "order">("all");

  // Global field definitions for previewing values
  const { getFieldName, getFieldUnit } = useMeasurementFields();

  // Tailoring services list
  const [services, setServices] = useState<Service[]>([]);

  // Dialog states
  const [takeMeasurementOpen, setTakeMeasurementOpen] = useState(false);
  const [selectedCustomerIdForNew, setSelectedCustomerIdForNew] = useState<number | null>(null);
  const [detailsMeasurement, setDetailsMeasurement] = useState<MeasurementResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Handle URL params to auto-open take measurement
  useEffect(() => {
    if (customerIdParam) {
      setSelectedCustomerIdForNew(Number(customerIdParam));
      setTakeMeasurementOpen(true);
    } else if (openNewParam === "true") {
      setSelectedCustomerIdForNew(null);
      setTakeMeasurementOpen(true);
    }
  }, [customerIdParam, openNewParam]);

  // Load active services once
  useEffect(() => {
    let cancelled = false;
    const loadMetadata = async () => {
      try {
        const svcs = await getActiveServices(0, 100);
        if (!cancelled) {
          setServices(svcs);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      }
    };
    void loadMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch measurements
  const loadMeasurements = async (pageNumber: number, keyword: string) => {
    try {
      setLoading(true);
      const data = await getAllMeasurements(keyword, pageNumber, PAGE_SIZE);
      setMeasurements(data.content ?? []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Failed to load measurements:", err);
      toast.error("Failed to load measurements.");
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        void loadMeasurements(page, search);
      },
      search.trim() ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [page, search]);

  // Client-side filtering by service and order-link type
  const filteredMeasurements = useMemo(() => {
    return measurements.filter((m) => {
      if (serviceFilter !== "all" && String(m.serviceId) !== serviceFilter) {
        return false;
      }
      if (typeFilter === "walkin" && m.orderId) {
        return false;
      }
      if (typeFilter === "order" && !m.orderId) {
        return false;
      }
      return true;
    });
  }, [measurements, serviceFilter, typeFilter]);

  // Stats calculation
  const walkInCount = useMemo(
    () => measurements.filter((m) => !m.orderId).length,
    [measurements],
  );
  const orderCount = useMemo(
    () => measurements.filter((m) => Boolean(m.orderId)).length,
    [measurements],
  );

  const handleOpenTakeMeasurement = (customerId?: number) => {
    setSelectedCustomerIdForNew(customerId ?? null);
    setTakeMeasurementOpen(true);
  };

  const handleTakeMeasurementSuccess = () => {
    void loadMeasurements(0, search);
    setPage(0);
    // clear URL params if any
    if (customerIdParam || openNewParam) {
      setSearchParams({});
    }
  };

  const handleViewDetails = (m: MeasurementResponse) => {
    setDetailsMeasurement(m);
    setDetailsOpen(true);
  };

  const handleCreateOrder = (m: MeasurementResponse) => {
    const custId = m.customerId || m.userId;
    navigate(`/orders/new?customerId=${custId}&serviceId=${m.serviceId}`);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ruler className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Measurements
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {getTodayString()}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => handleOpenTakeMeasurement()}
          className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Take Measurement
        </Button>
      </div>

      {/* QUICK HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Measurements
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {totalElements}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across all tailoring services
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Walk-in Measurements
              </p>
              <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                Ready for Order
              </Badge>
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
              {walkInCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Taken in advance for future orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Order Measurements
              </p>
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                In Production
              </Badge>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {orderCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Linked to orders & garments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by customer name, phone, or service..."
            className="pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SERVICE FILTER */}
          <Select
            value={serviceFilter}
            onValueChange={(val) => {
              setServiceFilter(val || "all");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((svc) => (
                <SelectItem key={svc.id} value={String(svc.id)}>
                  {svc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* STATUS FILTER */}
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val as "all" | "walkin" | "order");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[150px] text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="walkin">Walk-in Only</SelectItem>
              <SelectItem value="order">Order-linked Only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void loadMeasurements(page, search)}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MEASUREMENTS LIST / TABLE */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Loading measurements...
          </div>
        </div>
      ) : filteredMeasurements.length === 0 ? (
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Ruler className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-foreground">
              {search || serviceFilter !== "all" || typeFilter !== "all"
                ? "No matching measurements found"
                : "No measurements recorded yet"}
            </h3>

            <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
              {search || serviceFilter !== "all" || typeFilter !== "all"
                ? "Try clearing your search keyword or filters to view all records."
                : "When customers come in to take measurements before placing an order, record their measurements here. They will automatically be available when creating orders later."}
            </p>

            <Button
              type="button"
              onClick={() => handleOpenTakeMeasurement()}
              className="mt-6 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Take Measurement Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">ID & Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Key Dimensions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMeasurements.map((m) => {
                    const fields = Object.entries(m.measurementFields || {});
                    const customerId = m.customerId || m.userId;

                    return (
                      <tr
                        key={m.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* ID & DATE */}
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                            M-{String(m.id).padStart(5, "0")}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDisplayDate(m.createdAt)}
                          </p>
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-4 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={() => navigate(`/customers/${customerId}?tab=measurements`)}
                            className="text-left font-medium text-foreground hover:text-orange-600 hover:underline"
                          >
                            {m.customerName || `Customer #${customerId}`}
                          </button>
                          {m.customerPhone && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {m.customerPhone}
                            </p>
                          )}
                        </td>

                        {/* SERVICE */}
                        <td className="px-4 py-3.5 align-top">
                          <Badge
                            variant="secondary"
                            className="font-medium text-xs bg-muted"
                          >
                            {m.serviceName || "Service"}
                          </Badge>
                        </td>

                        {/* KEY DIMENSIONS PREVIEW */}
                        <td className="px-4 py-3.5 align-top">
                          {fields.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              No values
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {fields.slice(0, 3).map(([fieldId, value]) => {
                                const name = getFieldName(fieldId);
                                const unit = getFieldUnit(fieldId, "");

                                return (
                                  <span
                                    key={fieldId}
                                    className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    <strong className="font-semibold text-foreground mr-1">
                                      {name}:
                                    </strong>
                                    {String(value)}
                                    {unit}
                                  </span>
                                );
                              })}
                              {fields.length > 3 && (
                                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  +{fields.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* STATUS BADGE */}
                        <td className="px-4 py-3.5 align-top">
                          {m.orderId ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 bg-emerald-50 text-[11px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            >
                              Order #{m.orderId}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-sky-300 bg-sky-50 text-[11px] text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                            >
                              Walk-in (No Order)
                            </Badge>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3.5 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(m)}
                              className="h-8 px-2.5 text-xs"
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleCreateOrder(m)}
                              className="h-8 bg-orange-600 px-2.5 text-xs text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                            >
                              <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                              Order
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {filteredMeasurements.length} of {totalElements} measurements
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>

                <span className="text-xs font-medium text-foreground">
                  Page {page + 1} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 text-xs"
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAKE MEASUREMENT DIALOG */}
      <TakeMeasurementDialog
        open={takeMeasurementOpen}
        onOpenChange={setTakeMeasurementOpen}
        initialCustomerId={selectedCustomerIdForNew}
        onSuccess={handleTakeMeasurementSuccess}
      />

      {/* VIEW MEASUREMENT DETAILS DIALOG */}
      <MeasurementDetailsDialog
        measurement={detailsMeasurement}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
