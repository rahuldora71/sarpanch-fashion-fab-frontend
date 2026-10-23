import {
  Card,
} from "@/components/ui/card";

import type {
  CustomerProfileSummary,
} from "@/models/Customer";

interface Props {
  summary: CustomerProfileSummary;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "—";

export default function CustomerProfileSummaryCards({
  summary,
}: Props) {
  const cards = [
    {
      label: "Total Orders",
      value: String(summary.totalOrders),
      className: "text-foreground",
    },
    {
      label: "Total Spent",
      value: money(summary.totalSpent),
      className:
        "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Current Balance",
      value: money(summary.currentBalance),
      className:
        summary.currentBalance > 0
          ? "text-orange-600 dark:text-orange-400"
          : "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Last Order",
      value: date(summary.lastOrderDate),
      className: "text-foreground",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="rounded-2xl border-border/80 bg-card p-3.5 sm:p-4 shadow-xs"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {card.label}
          </p>

          <p
            className={`mt-1 text-xl sm:text-2xl font-bold font-mono tabular-nums ${card.className}`}
          >
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}