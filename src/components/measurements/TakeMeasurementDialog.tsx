import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
  Ruler,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { MeasurementFieldsGrid } from "@/components/measurements/MeasurementFieldsGrid";
import { CreateCustomerDialog } from "@/components/orders/create/CreateCustomerDialog";

import {
  createCustomerMeasurement,
  getLatestMeasurement,
  getMeasurementCopySources,
  getServiceMeasurementConfig,
} from "@/services/measurementService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import { getActiveServices } from "@/services/serviceService";
import {
  getCustomerById,
  getCustomers,
  searchCustomers,
  type CustomerResponse,
  type CustomerSummary,
} from "@/services/CustomerService";

import type {
  MeasurementFieldDefinition,
  MeasurementFieldValues,
  MeasurementResponse,
  MeasurementSourceSummary,
  ServiceMeasurementField,
} from "@/types/measurement";
import type { Service } from "@/types/service";
import { copyCompatibleMeasurementValues } from "@/utils/measurementDraft";

interface TakeMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomerId?: number | null;
  onSuccess?: (measurement: MeasurementResponse) => void;
}

interface ServiceFieldState {
  fields: MeasurementFieldDefinition[];
  requiredFieldIds: number[];
}

function getServiceFields(
  configs: ServiceMeasurementField[],
  definitions: MeasurementFieldDefinition[],
): ServiceFieldState {
  const fields: MeasurementFieldDefinition[] = [];

  for (const config of configs) {
    const globalField = definitions.find((field) => field.id === config.fieldId);
    if (!globalField) continue;

    fields.push({
      ...globalField,
      unit: config.unit ?? globalField.unit ?? null,
      type: config.type ?? globalField.type ?? "text",
      displayOrder: config.displayOrder ?? globalField.displayOrder ?? 999,
    });
  }

  fields.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  return {
    fields,
    requiredFieldIds: configs
      .filter((config) => config.required === true)
      .map((config) => config.fieldId),
  };
}

export function TakeMeasurementDialog({
  open,
  onOpenChange,
  initialCustomerId,
  onSuccess,
}: TakeMeasurementDialogProps) {
  // Customer selection state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Service selection state
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Measurement fields state
  const { fields: globalFieldDefinitions } = useMeasurementFields();
  const [serviceFieldState, setServiceFieldState] = useState<ServiceFieldState>({
    fields: [],
    requiredFieldIds: [],
  });
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldValues, setFieldValues] = useState<MeasurementFieldValues>({});
  const [note, setNote] = useState("");
  const [alterationNote, setAlterationNote] = useState("");

  // History & copy sources
  const [latestMeasurement, setLatestMeasurement] = useState<MeasurementSourceSummary | null>(null);
  const [copySources, setCopySources] = useState<MeasurementSourceSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Submitting
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (!open) {
      setSelectedCustomer(null);
      setCustomerSearch("");
      setCustomerResults([]);
      setSelectedServiceId(null);
      setFieldValues({});
      setNote("");
      setAlterationNote("");
      setLatestMeasurement(null);
      setCopySources([]);
      return;
    }

    // Load active services
    const loadInitialData = async () => {
      try {
        setLoadingServices(true);
        const loadedServices = await getActiveServices(0, 100);
        setServices(loadedServices);
      } catch (err) {
        console.error("Failed to load initial data for take measurement:", err);
        toast.error("Failed to load tailoring services.");
      } finally {
        setLoadingServices(false);
      }
    };

    void loadInitialData();

    // If initialCustomerId is passed, load that customer
    if (initialCustomerId) {
      const loadCustomer = async () => {
        try {
          const cust = await getCustomerById(initialCustomerId);
          setSelectedCustomer({
            id: cust.id,
            name: cust.name,
            phone: cust.phone,
            customerCode: cust.customerCode,
            totalOrders: 0,
            totalSpent: 0,
            balance: 0,
          });
        } catch (err) {
          console.error("Failed to load preselected customer:", err);
        }
      };
      void loadCustomer();
    }
  }, [open, initialCustomerId]);

  // Customer search effect
  useEffect(() => {
    if (!open || selectedCustomer) return;

    let cancelled = false;
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const keyword = customerSearch.trim();
        const data = keyword
          ? await searchCustomers(keyword, 0, 10)
          : await getCustomers(0, 10);
        if (!cancelled) {
          setCustomerResults(data.content ?? []);
        }
      } catch (err) {
        console.error("Failed to search customers:", err);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    };

    const timer = setTimeout(fetchCustomers, customerSearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, customerSearch, selectedCustomer]);

  // When selected service changes, load fields and previous measurement
  useEffect(() => {
    if (!selectedServiceId || globalFieldDefinitions.length === 0) {
      setServiceFieldState({ fields: [], requiredFieldIds: [] });
      setFieldValues({});
      return;
    }

    let cancelled = false;

    const loadServiceConfig = async () => {
      try {
        setLoadingFields(true);
        const config = await getServiceMeasurementConfig(selectedServiceId);
        if (!cancelled) {
          const state = getServiceFields(
            config.measurementFields ?? [],
            globalFieldDefinitions,
          );
          setServiceFieldState(state);
          // Initialize empty field values
          const initialValues: MeasurementFieldValues = {};
          state.fields.forEach((f) => {
            initialValues[String(f.id)] = "";
          });
          setFieldValues(initialValues);
        }
      } catch (err) {
        console.error("Failed to load service measurement fields:", err);
        toast.error("Failed to load fields for the selected service.");
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    };

    void loadServiceConfig();

    // If customer is selected, check for existing measurements and copy sources
    if (selectedCustomer) {
      const loadCustomerMeasurements = async () => {
        try {
          setLoadingHistory(true);
          const [latest, sources] = await Promise.all([
            getLatestMeasurement(selectedCustomer.id, selectedServiceId),
            getMeasurementCopySources(selectedCustomer.id, selectedServiceId),
          ]);
          if (!cancelled) {
            setLatestMeasurement(latest);
            setCopySources(sources);
          }
        } catch (err) {
          console.error("Failed to load customer measurement history:", err);
        } finally {
          if (!cancelled) setLoadingHistory(false);
        }
      };

      void loadCustomerMeasurements();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, selectedCustomer, globalFieldDefinitions]);

  // Handle new customer created via quick dialog
  const handleCustomerCreated = (newCust: CustomerResponse) => {
    setSelectedCustomer({
      id: newCust.id,
      name: newCust.name,
      phone: newCust.phone,
      customerCode: newCust.customerCode,
      totalOrders: 0,
      totalSpent: 0,
      balance: 0,
    });
    setCustomerSearch("");
    toast.success(`Customer ${newCust.name} added!`);
  };

  // Populate from latest measurement
  const handleUseLatest = () => {
    if (!latestMeasurement) return;
    setFieldValues((prev) => ({
      ...prev,
      ...latestMeasurement.measurementFields,
    }));
    if (latestMeasurement.note) setNote(latestMeasurement.note);
    if (latestMeasurement.alterationNote)
      setAlterationNote(latestMeasurement.alterationNote);
    toast.success("Loaded latest measurement values!");
  };

  // Copy compatible values from another service
  const handleCopyFromSource = (source: MeasurementSourceSummary) => {
    const copied = copyCompatibleMeasurementValues(
      source,
      serviceFieldState.fields,
    );
    setFieldValues((prev) => ({
      ...prev,
      ...copied,
    }));
    toast.success(`Copied matching values from ${source.serviceName}!`);
  };

  // Save measurement
  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer.");
      return;
    }
    if (!selectedServiceId) {
      toast.error("Please select a tailoring service.");
      return;
    }

    // Check required fields
    for (const requiredId of serviceFieldState.requiredFieldIds) {
      const val = fieldValues[String(requiredId)];
      if (val === undefined || val === null || String(val).trim() === "") {
        const fieldName =
          serviceFieldState.fields.find((f) => f.id === requiredId)?.name ||
          `Field ${requiredId}`;
        toast.error(`Please enter value for required field: ${fieldName}`);
        return;
      }
    }

    try {
      setSaving(true);
      const saved = await createCustomerMeasurement({
        userId: selectedCustomer.id,
        serviceId: selectedServiceId,
        measurementFields: fieldValues,
        note: note.trim() || undefined,
        alterationNote: alterationNote.trim() || undefined,
        editable: true,
      });

      toast.success(
        `Measurement saved successfully for ${selectedCustomer.name}!`,
      );
      onSuccess?.(saved);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to save customer measurement:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to save measurement.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[750px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Take Customer Measurement</DialogTitle>
              <DialogDescription>
                Record measurements for walk-in customers now. They can place an order anytime later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* STEP 1: CUSTOMER SELECTION */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Customer Information
              </Label>
              {!selectedCustomer && (
                <CreateCustomerDialog onCreated={handleCustomerCreated} />
              )}
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {selectedCustomer.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedCustomer.phone || "No phone"}
                      {selectedCustomer.customerCode && (
                        <span> · Code: {selectedCustomer.customerCode}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name or phone..."
                    className="pl-9 pr-9"
                  />
                  {customerSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomerSearch("")}
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching customers...
                  </div>
                ) : customerResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border bg-background divide-y divide-border">
                    {customerResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setCustomerSearch("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{cust.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cust.phone || "No phone"}
                            {cust.customerCode && ` · ${cust.customerCode}`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                    No customers found matching "{customerSearch}". Click "New Customer" to register them now.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: TAILORING SERVICE SELECTION */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Select Garment / Service
            </Label>

            {loadingServices ? (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading tailoring services...
              </div>
            ) : services.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No active tailoring services configured. Please configure services in Services & Pricing.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((svc) => {
                  const isSelected = selectedServiceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        isSelected
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm dark:bg-orange-950/40 dark:text-orange-300"
                          : "border-border bg-background text-foreground hover:bg-accent",
                      ].join(" ")}
                    >
                      <span>{svc.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: MEASUREMENT VALUES */}
          {selectedServiceId ? (
            <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedService?.name} Measurements
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Enter measurement values in the fields below.
                  </p>
                </div>

                {/* COPY & SHORTCUT ACTIONS */}
                <div className="flex flex-wrap items-center gap-2">
                  {latestMeasurement && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseLatest}
                      disabled={loadingHistory}
                      className="text-xs"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Use Previous Measurement
                    </Button>
                  )}

                  {copySources.length > 0 && (
                    <div className="flex items-center gap-1">
                      {copySources.slice(0, 2).map((source) => (
                        <Button
                          key={source.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyFromSource(source)}
                          className="text-xs"
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy from {source.serviceName}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {loadingFields ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading measurement fields...
                </div>
              ) : (
                <MeasurementFieldsGrid
                  fields={serviceFieldState.fields}
                  values={fieldValues}
                  requiredFieldIds={serviceFieldState.requiredFieldIds}
                  onChange={setFieldValues}
                />
              )}

              {/* NOTES / REMARKS */}
              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="measurement-note" className="text-xs font-medium">
                    Notes / Remarks (Optional)
                  </Label>
                  <Textarea
                    id="measurement-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Loose fit requested, extra margin on cuffs..."
                    className="h-20 text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alteration-note" className="text-xs font-medium">
                    Alteration / Special Fit Notes (Optional)
                  </Label>
                  <Textarea
                    id="alteration-note"
                    value={alterationNote}
                    onChange={(e) => setAlterationNote(e.target.value)}
                    placeholder="e.g. Sloping shoulder, high waist preference..."
                    className="h-20 text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Ruler className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Select a garment / tailoring service
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a service above to load the appropriate measurement fields.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedCustomer || !selectedServiceId}
            className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Measurement...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Measurement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
