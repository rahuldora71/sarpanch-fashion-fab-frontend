import {
  Check,
  Pencil,
  Power,
  Ruler,
  Tag,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  Service,
} from "@/types/service";

interface ServiceRowProps {
  service: Service;

  onEdit: (
    service: Service,
  ) => void;

  onStatusChange: (
    service: Service,
  ) => void;
}

export function ServiceRow({
  service,
  onEdit,
  onStatusChange,
}: ServiceRowProps) {
  const measurementCount =
    service.measurementFields?.length ??
    0;

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      {/* Icon */}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Tag className="h-4 w-4" />
      </div>

      {/* Name */}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            service.active
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {service.name}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {service.category}
          </span>

          <span>•</span>

          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3 w-3" />

            {measurementCount}{" "}
            {measurementCount === 1
              ? "measurement"
              : "measurements"}
          </span>

          {!service.active && (
            <>
              <span>•</span>

              <span>
                Inactive
              </span>
            </>
          )}
        </div>
      </div>

      {/* Price */}

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold tabular-nums">
          ₹
          {service.price.toLocaleString(
            "en-IN",
          )}
        </p>

        <p className="text-xs text-muted-foreground">
          Commission ₹
          {service.tailorCommission.toLocaleString(
            "en-IN",
          )}
        </p>
      </div>

      {/* Edit */}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() =>
          onEdit(service)
        }
        title="Edit service"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      {/* Status */}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          service.active
            ? "text-destructive hover:text-destructive"
            : "text-primary"
        }
        onClick={() =>
          onStatusChange(service)
        }
      >
        {service.active ? (
          <>
            <Power className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden md:inline">
              Deactivate
            </span>
          </>
        ) : (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden md:inline">
              Activate
            </span>
          </>
        )}
      </Button>
    </div>
  );
}