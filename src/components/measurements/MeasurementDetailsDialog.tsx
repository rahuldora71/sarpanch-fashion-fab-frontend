import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Phone,
  Ruler,
  ShoppingBag,
  User,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import type {
  MeasurementResponse,
} from "@/types/measurement";

interface MeasurementDetailsDialogProps {
  measurement: MeasurementResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (value?: string) => {
  if (!value) return "Unknown";
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

export function MeasurementDetailsDialog({
  measurement,
  open,
  onOpenChange,
}: MeasurementDetailsDialogProps) {
  const navigate = useNavigate();
  const { getFieldName, getFieldUnit, loading: loadingFields } = useMeasurementFields();

  if (!measurement) return null;

  const handleCreateOrder = () => {
    onOpenChange(false);
    const customerId = measurement.customerId || measurement.userId;
    navigate(`/orders/new?customerId=${customerId}&serviceId=${measurement.serviceId}`);
  };

  const fieldEntries = Object.entries(measurement.measurementFields || {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Measurement M-{String(measurement.id).padStart(5, "0")}
                </DialogTitle>
                <DialogDescription>
                  Recorded on {formatDate(measurement.createdAt)}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                measurement.orderId
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
              }
            >
              {measurement.orderId
                ? `Order #${measurement.orderId}`
                : "Walk-in (No Order Yet)"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* CUSTOMER & SERVICE SUMMARY */}
          <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {measurement.customerName || `Customer #${measurement.customerId || measurement.userId}`}
                </span>
              </div>
              {measurement.customerPhone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{measurement.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Garment Service
              </span>
              <div>
                <Badge className="bg-orange-500/10 font-semibold text-orange-700 dark:bg-orange-400/10 dark:text-orange-300 border-none">
                  {measurement.serviceName || "Service"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Service ID: #{measurement.serviceId}
              </p>
            </div>
          </div>

          {/* MEASUREMENT FIELD VALUES */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Measurement Dimensions
            </h4>

            {loadingFields ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading field details...
              </div>
            ) : fieldEntries.length === 0 ? (
              <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                No measurement values recorded.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fieldEntries.map(([fieldId, value]) => {
                  const name = getFieldName(fieldId);
                  const unit = getFieldUnit(fieldId, "");

                  return (
                    <div
                      key={fieldId}
                      className="rounded-lg border bg-card p-3 shadow-xs"
                    >
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {name}
                      </p>
                      <p className="mt-1 text-base font-bold text-foreground">
                        {String(value)}
                        {unit && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {unit}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* NOTES & ALTERATIONS */}
          {(measurement.note || measurement.alterationNote) && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              {measurement.note && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes / Remarks
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {measurement.note}
                  </p>
                </div>
              )}

              {measurement.note && measurement.alterationNote && <Separator />}

              {measurement.alterationNote && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Alteration Notes
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {measurement.alterationNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={handleCreateOrder}
            className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Create Order with this Measurement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
