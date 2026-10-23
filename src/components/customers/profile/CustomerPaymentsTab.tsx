import { Card, CardContent } from "@/components/ui/card";

import type {
  CustomerProfilePayment,
} from "@/models/Customer";

interface Props {
  payments: CustomerProfilePayment[];
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function CustomerPaymentsTab({
  payments,
}: Props) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No payments found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div
                key={payment.paymentId}
                className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    PAY-
                    {String(payment.paymentId).padStart(
                      6,
                      "0",
                    )}
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(payment.paidAt)}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Order #{payment.orderId} ·{" "}
                    {payment.paymentMethod}
                    {payment.paymentType
                      ? ` · ${payment.paymentType}`
                      : ""}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +{money(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}