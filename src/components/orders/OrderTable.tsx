import { useNavigate } from "react-router-dom";

import type { OrderSummary } from "@/types/order";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderTableProps {
  orders: OrderSummary[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function OrderTable({
  orders,
}: OrderTableProps) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <div
        className="
          flex
          min-h-[155px]
          items-center
          justify-center
          rounded-lg
          border
          border-border
          bg-card
          text-center
        "
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            No orders found
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Try changing your search or status filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-lg
        border
        border-border
        bg-card
        shadow-sm
      "
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-5 py-3 text-left">
                <HeaderCell>Order</HeaderCell>
              </th>

              <th className="px-4 py-3 text-left">
                <HeaderCell>Customer</HeaderCell>
              </th>

              <th className="px-4 py-3 text-center">
                <HeaderCell>Garments</HeaderCell>
              </th>

              <th className="px-4 py-3 text-right">
                <HeaderCell>Total</HeaderCell>
              </th>

              <th className="px-4 py-3 text-right">
                <HeaderCell>Due</HeaderCell>
              </th>

              <th className="px-4 py-3 text-left">
                <HeaderCell>Created</HeaderCell>
              </th>

              <th className="px-4 py-3 text-left">
                <HeaderCell>Delivery</HeaderCell>
              </th>

              <th className="px-5 py-3 text-left">
                <HeaderCell>Status</HeaderCell>
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() =>
                  navigate(`/orders/${order.id}`)
                }
                className="
                  cursor-pointer
                  border-b
                  border-border
                  transition-colors
                  last:border-b-0
                  hover:bg-muted/50
                "
              >
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold text-foreground">
                    {order.orderNumber}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.customerName}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.customerPhone}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-center">
                  <span className="text-sm text-muted-foreground">
                    {order.garmentCount}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </span>
                </td>

                <td className="px-4 py-3.5 text-right">
                  {order.due <= 0 ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Paid
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {formatCurrency(order.due)}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.deliveryDate)}
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <OrderStatusBadge
                    status={order.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        text-[11px]
        font-semibold
        uppercase
        tracking-wide
        text-muted-foreground
      "
    >
      {children}
    </span>
  );
}