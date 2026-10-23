import { Eye, Plus } from "lucide-react";

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

export default function CustomerMobileCard({
  customer,
  onView,
  onCreateOrder,
}: Props) {
  const balance = customer.balance ?? 0;

  return (
    <div className="border-b border-border p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <CustomerAvatar
          name={customer.name}
          image={customer.image}
          size="md"
        />

        <button
          type="button"
          onClick={() => onView(customer.id)}
          className="
            min-w-0 flex-1 text-left
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
          "
        >
          <p className="truncate font-medium text-foreground">
            {customer.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {customer.customerCode || "No code"}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {customer.phone ||
              customer.email ||
              "No contact"}
          </p>
        </button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onCreateOrder(customer.id)
          }
          className="shrink-0"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Order
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3 text-sm">
        <div>
          <p className="text-[10.5px] uppercase font-medium text-muted-foreground">
            Orders
          </p>

          <p className="font-mono font-bold text-foreground mt-0.5">
            {customer.totalOrders ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-[10.5px] uppercase font-medium text-muted-foreground">
            Spent
          </p>

          <p className="font-mono font-bold text-foreground mt-0.5">
            {money(customer.totalSpent)}
          </p>
        </div>

        <div>
          <p className="text-[10.5px] uppercase font-medium text-muted-foreground">
            Balance
          </p>

          <div className="font-mono text-sm font-semibold mt-0.5">
            {balance > 0 ? (
              <span className="text-orange-600 dark:text-orange-400 font-bold">
                {money(balance)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Clear ✓
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-2.5 h-10 w-full rounded-xl text-xs font-semibold hover:bg-accent"
        onClick={() => onView(customer.id)}
      >
        <Eye className="mr-2 h-4 w-4" />
        View Customer Profile (प्रोफाइल देखें)
      </Button>
    </div>
  );
}