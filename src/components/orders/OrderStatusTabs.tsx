import type { OrderStatus } from "@/types/order";

interface StatusTab {
  value: "ALL" | OrderStatus;
  label: string;
}

const tabs: StatusTab[] = [
  { value: "ALL", label: "All Orders" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CUTTING", label: "Cutting" },
  { value: "STITCHING", label: "Stitching" },
  { value: "FINISHING", label: "Finishing" },
  { value: "QUALITY_CHECK", label: "Quality Check" },
  { value: "ALTERATION", label: "Alteration" },
  { value: "READY", label: "Ready" },
  { value: "DELIVERED", label: "Delivered" },
];

interface OrderStatusTabsProps {
  activeStatus: "ALL" | OrderStatus;
  counts: Partial<Record<"ALL" | OrderStatus, number>>;
  onChange: (status: "ALL" | OrderStatus) => void;
}

export function OrderStatusTabs({
  activeStatus,
  counts,
  onChange,
}: OrderStatusTabsProps) {
  return (
    <div
      className="
        w-full
        overflow-x-auto
        scrollbar-none
      "
    >
      <div className="flex w-max min-w-full items-center gap-1.5">
        {tabs.map((tab) => {
          const active = activeStatus === tab.value;
          const count = counts[tab.value];

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`
                inline-flex
                h-8
                shrink-0
                items-center
                gap-1.5
                rounded-full
                border
                px-3
                text-xs
                font-medium
                transition-colors

                ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <span>{tab.label}</span>

              {count !== undefined && (
                <span className="opacity-70">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}