import type { CustomerProfileOrder } from "@/models/Customer";
import CustomerOrderCard from "./CustomerOrderCard";

interface Props {
  orders: CustomerProfileOrder[];
}

export default function CustomerOrdersTab({
  orders,
}: Props) {
  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No orders found.
        </div>
      ) : (
        orders.map((order) => (
          <CustomerOrderCard
            key={order.id}
            order={order}
          />
        ))
      )}
    </div>
  );
}