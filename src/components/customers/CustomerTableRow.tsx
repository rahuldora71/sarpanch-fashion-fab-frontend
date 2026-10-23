import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import CustomerAvatar from "./CustomerAvatar";

import type { CustomerSummary } from "@/models/Customer";

interface Props {
  customer: CustomerSummary;
  onView: (id: number) => void;
  onCreateOrder: (id: number) => void;
}

const money = (value?: number) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(new Date(`${value}T00:00:00`))
    : "—";

export default function CustomerTableRow({
  customer,
  onView,
  onCreateOrder,
}: Props) {
  const balance = customer.balance ?? 0;

  return (
    <div
      className="
        grid
        grid-cols-[minmax(280px,2.2fr)_1fr_1fr_.55fr_1fr_.8fr_1fr_70px]
        items-center
        border-b border-border
        px-5
        py-3
        last:border-b-0
        hover:bg-muted/40
      "
    >
      {/* CUSTOMER */}

      <button
        type="button"
        onClick={() => onView(customer.id)}
        className="
          flex min-w-0 items-center gap-3 text-left
          rounded-md
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
        "
      >
        <CustomerAvatar
          name={customer.name}
          image={customer.image}
          size="sm"
        />

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {customer.name}
          </span>

          {customer.email ? (
            <span className="block truncate text-xs text-muted-foreground">
              {customer.email}
            </span>
          ) : null}
        </span>
      </button>

      {/* CODE */}

      <div className="font-mono text-xs text-muted-foreground">
        {customer.customerCode || "—"}
      </div>

      {/* PHONE */}

      <div className="text-sm text-muted-foreground">
        {customer.phone || "—"}
      </div>

      {/* ORDERS */}

      <div className="font-mono text-sm font-medium text-foreground">
        {customer.totalOrders ?? "—"}
      </div>

      {/* TOTAL SPENT */}

      <div className="font-mono text-sm font-semibold text-foreground">
        {money(customer.totalSpent)}
      </div>

      {/* BALANCE */}

      <div className="font-mono text-sm font-semibold">
        {balance > 0 ? (
          <span className="text-orange-600 dark:text-orange-400 font-bold">
            {money(balance)}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Clear ✓
          </span>
        )}
      </div>

      {/* LAST ORDER */}

      <div className="text-sm text-muted-foreground">
        {date(customer.lastOrderDate)}
      </div>

      {/* ACTION */}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs font-semibold gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition"
          onClick={() =>
            onCreateOrder(customer.id)
          }
          title="Create order"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Order</span>
        </Button>
      </div>
    </div>
  );
}