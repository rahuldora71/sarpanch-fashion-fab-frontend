import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ImagePlus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { getActiveServices } from "@/services/serviceService";
import type { Service } from "@/types/service";
import type { GarmentFormValue } from "@/types/order";

interface GarmentFormProps {
  value: GarmentFormValue;
  onChange: (value: GarmentFormValue) => void;
}

export function GarmentForm({ value, onChange }: GarmentFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFabricDetails, setShowFabricDetails] = useState(
    Boolean(value.sampleId || value.bookNumber || value.pageNumber),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        setLoading(true);
        setError(null);

        const response = await getActiveServices();

        if (cancelled) return;

        const raw: any = response;
        const list: Service[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.content)
            ? raw.content
            : [];

        setServices(list);
      } catch (err) {
        console.error("Failed to load active services:", err);
        if (!cancelled) {
          setServices([]);
          setError("Unable to load services.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => Number(service.id) === Number(value.serviceId),
      ),
    [services, value.serviceId],
  );

  const handleServiceChange = (rawId: string) => {
    if (!rawId) {
      onChange({
        ...value,
        serviceId: null,
        serviceName: "",
        price: 0,
        addOns: [],
      });
      return;
    }

    const id = Number(rawId);
    const service = services.find((item) => Number(item.id) === id);
    if (!service) return;

    onChange({
      ...value,
      serviceId: Number(service.id),
      serviceName: service.name,
      price: Number(service.price ?? 0),
      addOns: [],
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="garment-service">Garment Type</Label>

          <div className="relative">
            <select
              id="garment-service"
              value={value.serviceId == null ? "" : String(value.serviceId)}
              onChange={(event) => handleServiceChange(event.target.value)}
              disabled={loading}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm outline-none transition focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loading
                  ? "Loading services..."
                  : services.length === 0
                    ? "No active services"
                    : "Select garment type"}
              </option>

              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="garment-price">Price (₹)</Label>

          <Input
            id="garment-price"
            type="number"
            min={0}
            step="1"
            value={value.price}
            onChange={(event) => {
              const raw = event.target.value;
              onChange({
                ...value,
                price: raw === "" ? 0 : Math.max(0, Number(raw)),
              });
            }}
          />

          {selectedService && (
            <p className="text-xs text-muted-foreground">
              Service price: ₹{Number(selectedService.price).toLocaleString("en-IN")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="garment-sample-number">Sample Number</Label>
          <Input
            id="garment-sample-number"
            value={value.sampleNumber}
            onChange={(event) =>
              onChange({ ...value, sampleNumber: event.target.value })
            }
            placeholder="1"
          />
          <p className="text-xs text-muted-foreground">
            Defaults to this garment's add order.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fabric Sample
          </p>

          {showFabricDetails && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFabricDetails(false);
                onChange({
                  ...value,
                  sampleId: "",
                  bookNumber: "",
                  pageNumber: "",
                });
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>

        {!showFabricDetails ? (
          <button
            type="button"
            onClick={() => setShowFabricDetails(true)}
            className="flex min-h-[88px] w-full items-center rounded-lg border border-dashed bg-background px-4 text-left transition hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="ml-4">
              <p className="text-sm font-medium">Add Fabric Sample</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add sample ID, book and page details.
              </p>
            </div>
          </button>
        ) : (
          <div className="rounded-lg border bg-background p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sample-id">Sample ID</Label>
                <Input
                  id="sample-id"
                  value={value.sampleId}
                  onChange={(event) =>
                    onChange({ ...value, sampleId: event.target.value })
                  }
                  placeholder="FS-004826"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-number">Book #</Label>
                <Input
                  id="book-number"
                  value={value.bookNumber}
                  onChange={(event) =>
                    onChange({ ...value, bookNumber: event.target.value })
                  }
                  placeholder="01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-number">Page #</Label>
                <Input
                  id="page-number"
                  value={value.pageNumber}
                  onChange={(event) =>
                    onChange({ ...value, pageNumber: event.target.value })
                  }
                  placeholder="4826"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="garment-notes">Instructions / Notes</Label>
        <Input
          id="garment-notes"
          value={value.notes}
          onChange={(event) =>
            onChange({ ...value, notes: event.target.value })
          }
          placeholder={'e.g. Regular fit, +2" length'}
        />
      </div>
    </div>
  );
}
