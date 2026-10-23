import { useState } from "react";
import { Eye, ZoomIn, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CustomerProfileOrder } from "@/models/Customer";

interface Props {
  order: CustomerProfileOrder;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "—";

const statusClass = (status: string | null | undefined) => {
  if (!status) {
    return "border-muted-foreground/30 bg-muted/20 text-muted-foreground";
  }

  const normalized = status.toUpperCase();

  if (
    normalized === "DELIVERED" ||
    normalized === "READY"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  if (
    normalized === "PARTIALLY_READY" ||
    normalized === "PARTIALLY_DELIVERED"
  ) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }

  if (normalized === "CANCELLED") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
};

const garmentClass = (status: string | null | undefined) => {
  if (!status) {
    return "border-muted-foreground/30 bg-muted/20 text-muted-foreground";
  }

  const normalized = status.toUpperCase();

  if (normalized === "FABRIC_CUT") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }

  if (
    normalized === "READY" ||
    normalized === "DELIVERED"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
};

const humanize = (value: string | null | undefined) => {
  if (!value) return "In Progress";
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
};

export default function CustomerOrderCard({
  order,
}: Props) {
  const navigate = useNavigate();
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const paidAmount = Math.max(0, (order.total || 0) - (order.balanceDue || 0));

  return (
    <>
      <Card className="border-border bg-card shadow-none">
        <CardContent className="p-4">
          {/* HEADER */}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {order.orderNumber}
                </span>

                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusClass(
                    order.status,
                  )}`}
                >
                  {humanize(order.status)}
                </span>

                {order.billImageUrl && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                    <FileText className="h-3 w-3" />
                    Bill Slip Attached
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Created {formatDate(order.orderDate)}
                {order.deliveryDate
                  ? ` · Delivery ${formatDate(
                      order.deliveryDate,
                    )}`
                  : ""}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/orders/${order.id}`)
              }
              className="self-start"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View
            </Button>
          </div>

          {/* BILL SLIP PREVIEW (IF ATTACHED) */}
          {order.billImageUrl && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5">
              <img
                src={order.billImageUrl}
                alt={`Order Slip ${order.orderNumber}`}
                className="h-16 w-16 cursor-pointer rounded-md object-cover border border-border transition-transform hover:scale-105"
                onClick={() => setIsZoomOpen(true)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Handwritten Order Slip</p>
                <p className="text-[11px] text-muted-foreground">Full resolution photo preserved</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary font-medium mt-1"
                  onClick={() => setIsZoomOpen(true)}
                >
                  <ZoomIn className="mr-1 h-3 w-3" />
                  View Original Bill Slip
                </Button>
              </div>
            </div>
          )}

          {/* GARMENTS */}

          <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
            {order.garments.map((garment) => (
              <span
                key={garment.id}
                className="inline-flex items-center overflow-hidden rounded-md border border-border text-xs"
              >
                <span
                  className={`border-r px-2 py-1 ${garmentClass(
                    garment.status,
                  )}`}
                >
                  {humanize(garment.status)}
                </span>

                <span className="bg-muted px-2 py-1 text-muted-foreground">
                  {garment.serviceName}
                </span>
              </span>
            ))}
          </div>

          {/* TOTAL & FINANCIALS */}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Total:{" "}
                <strong className="font-semibold text-foreground">
                  {money(order.total)}
                </strong>
              </span>

              <span className="text-xs text-muted-foreground">
                Paid:{" "}
                <strong className="font-medium text-emerald-600 dark:text-emerald-400">
                  {money(paidAmount)}
                </strong>
              </span>
            </div>

            <span
              className={
                order.balanceDue > 0
                  ? "font-medium text-orange-600 dark:text-orange-400"
                  : "font-medium text-emerald-600 dark:text-emerald-400"
              }
            >
              {order.balanceDue > 0
                ? `Due: ${money(order.balanceDue)}`
                : "Paid in full"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* LIGHTBOX MODAL FOR BILL SLIP */}
      {order.billImageUrl && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-3xl overflow-hidden p-0">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center justify-between text-base">
                <span>Original Order Slip — {order.orderNumber}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Date: {formatDate(order.orderDate)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-auto bg-black/90 p-2 flex items-center justify-center">
              <img
                src={order.billImageUrl}
                alt={`Order Slip ${order.orderNumber}`}
                className="max-h-[75vh] w-auto max-w-full rounded object-contain shadow-2xl"
              />
            </div>
            <div className="p-3 bg-card border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Full resolution (uncompressed)</span>
              <a
                href={order.billImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Open in new tab
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}