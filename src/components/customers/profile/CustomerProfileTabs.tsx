import { useNavigate, useSearchParams } from "react-router-dom";

export type CustomerProfileTab =
  | "overview"
  | "photos"
  | "measurements"
  | "orders"
  | "payments"
  | "alterations";

const tabs: {
  value: CustomerProfileTab;
  label: string;
}[] = [
  {
    value: "overview",
    label: "Overview",
  },
  {
    value: "photos",
    label: "Photos & Posture",
  },
  {
    value: "measurements",
    label: "Measurements",
  },
  {
    value: "orders",
    label: "Orders",
  },
  {
    value: "payments",
    label: "Payments",
  },
  {
    value: "alterations",
    label: "Alterations",
  },
];

interface Props {
  customerId: number;
  activeTab: CustomerProfileTab;
}

export default function CustomerProfileTabs({
  customerId,
  activeTab,
}: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const changeTab = (
    tab: CustomerProfileTab,
  ) => {
    const next = new URLSearchParams(params);

    if (tab === "overview") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }

    const query = next.toString();

    navigate(
      `/customers/${customerId}${
        query ? `?${query}` : ""
      }`,
    );
  };

  return (
    <div className="mt-7 flex gap-6 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const active =
          activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() =>
              changeTab(tab.value)
            }
            className={`relative whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}

            {active ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-600 dark:bg-orange-500" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}