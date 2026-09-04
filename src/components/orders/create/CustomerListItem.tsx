import { Check, ChevronRight } from "lucide-react";
import type { CustomerSummary } from "@/models/Customer";

interface CustomerListItemProps {
  customer: CustomerSummary;
  selected?: boolean;
  onSelect: (customer: CustomerSummary) => void;
}

export function CustomerListItem({
  customer,
  selected = false,
  onSelect,
}: CustomerListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(customer)}
      aria-pressed={selected}
      className={[
        "group flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-accent",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        {selected && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{customer.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {customer.phone || "No phone"}
            <span className="mx-1.5">·</span>
            {customer.customerCode || "No code"}
          </p>
        </div>
      </div>

      {!selected && (
        <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}
