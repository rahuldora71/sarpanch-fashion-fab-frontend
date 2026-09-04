import type { OrderStatus } from "@/types/order";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "border-border bg-muted text-muted-foreground",
  },

  CONFIRMED: {
    label: "Confirmed",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },

  CUTTING: {
    label: "Cutting",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },

  STITCHING: {
    label: "Stitching",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },

  FINISHING: {
    label: "Finishing",
    className:
      "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },

  QUALITY_CHECK: {
    label: "Quality Check",
    className:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },

  ALTERATION: {
    label: "Alteration",
    className:
      "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },

  READY: {
    label: "Ready",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },

  DELIVERED: {
    label: "Delivered",
    className:
      "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

export function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-md
        border
        px-2
        py-0.5
        text-[11px]
        font-medium
        whitespace-nowrap
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}