import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const isLocked = Boolean(value.isLocked);

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
              disabled={loading || isLocked}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm outline-none transition focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loading
                  ? "Loading services..."
                  : services.length === 0
                    ? "No active services"
                    : "Select garment type"}
              </option>

              {value.serviceId != null &&
                !selectedService &&
                value.serviceName && (
                  <option value={String(value.serviceId)}>
                    {value.serviceName}
                  </option>
                )}

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
            disabled={isLocked}
            value={value.price}
            onChange={(event) => {
              const raw = event.target.value;
              const newPrice = raw === "" ? 0 : Math.max(0, Number(raw));
              const sPrice = selectedService ? Number(selectedService.price) || 0 : 0;
              const autoCustFabric = sPrice > 0 && newPrice > sPrice ? false : value.customerFabric;
              onChange({
                ...value,
                price: newPrice,
                customerFabric: autoCustFabric,
              });
            }}
          />

          {selectedService && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Service price: ₹{Number(selectedService.price).toLocaleString("en-IN")}
              </p>
              {Number(value.price) > Number(selectedService.price) && (
                <p className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                  ✨ Fabric portion: ₹{(Number(value.price) - Number(selectedService.price)).toLocaleString("en-IN")} (Shop fabric included)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="garment-sample-number">Sample Number</Label>
          <Input
            id="garment-sample-number"
            disabled={isLocked}
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

      {/* Fabric Source Selection */}
      <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Label className="text-xs font-semibold text-foreground">Fabric Source</Label>
            <p className="text-[11px] text-muted-foreground">
              Specify whether customer brought their own cloth or purchased showroom fabric
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onChange({ ...value, customerFabric: true })}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors border ${
                value.customerFabric !== false
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/50"
              }`}
            >
              ✂️ Customer Cloth (Stitching Only)
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onChange({ ...value, customerFabric: false })}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors border ${
                value.customerFabric === false
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/50"
              }`}
            >
              🧵 Shop Fabric Included
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="garment-notes">Instructions / Notes</Label>
        <Input
          id="garment-notes"
          disabled={isLocked}
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
