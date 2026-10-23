import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  CustomerProfileOrder,
  CustomerProfileSummary,
} from "@/models/Customer";

import CustomerOrderCard from "./CustomerOrderCard";
import CustomerProfileSummaryCards from "./CustomerProfileSummaryCards";

interface Props {
  summary: CustomerProfileSummary;
  orders: CustomerProfileOrder[];
}

export default function CustomerOverview({
  summary,
  orders,
}: Props) {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-4">
      <CustomerProfileSummaryCards
        summary={summary}
      />

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="px-4 pb-3 pt-4">
          <CardTitle className="text-base text-foreground">
            Order History
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-4">
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders found.
            </p>
          ) : (
            recentOrders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}