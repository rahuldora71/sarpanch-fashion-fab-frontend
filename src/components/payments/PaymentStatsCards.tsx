import { TrendingUp, Calendar, Smartphone, AlertTriangle, PackageCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PaymentStatsCardsProps {
  // Card 1: Today's Collection
  todayTotal?: number;
  todayTotalAmount?: number;
  todayCount?: number;
  todayPaymentCount?: number;

  // Card 2: Selected Period
  rangeTotal?: number;
  rangeTotalAmount?: number;
  rangeCount?: number;
  rangePaymentCount?: number;

  // Card 3: Method Breakdown
  methodBreakdown?: Record<string, number>;
  paymentMethodBreakdown?: Record<string, number>;

  // Card 4: Delivered Unpaid
  deliveredUnpaidBalance?: number;
  deliveredUnpaidTotalBalance?: number;
  deliveredUnpaidCount?: number;

  periodLabel: string;
  loading?: boolean;
  syncing?: boolean;
  onViewUnpaid: () => void;
}

export default function PaymentStatsCards(props: PaymentStatsCardsProps) {
  const {
    periodLabel,
    loading = false,
    syncing = false,
    onViewUnpaid,
  } = props;

  // 1. Today's Collection & Count
  const displayTodayTotal = Number(props.todayTotal ?? props.todayTotalAmount ?? 0);
  const displayTodayCount = Number(props.todayCount ?? props.todayPaymentCount ?? 0);

  // 2. Selected Period Total (rangeTotal) & Transaction Count (rangePaymentCount)
  const displayRangeTotal = Number(props.rangeTotal ?? props.rangeTotalAmount ?? 0);
  const displayRangePaymentCount = Number(
    props.rangePaymentCount ?? props.rangeCount ?? 0
  );

  // 3. Payment Method Breakdown (from paymentMethodBreakdown)
  const breakdown =
    props.paymentMethodBreakdown ??
    props.methodBreakdown ??
    {};
  const cashAmount = Number(breakdown.CASH ?? 0);
  const upiAmount = Number(breakdown.UPI ?? 0);
  const otherAmount =
    Number(breakdown.CARD ?? 0) +
    Number(breakdown.BANK_TRANSFER ?? 0) +
    Number(breakdown.CHEQUE ?? 0);

  // 4. Delivered Unpaid Total Balance & Orders Count
  const displayDeliveredUnpaidTotalBalance = Number(
    props.deliveredUnpaidTotalBalance ?? props.deliveredUnpaidBalance ?? 0
  );
  const displayDeliveredUnpaidCount = Number(props.deliveredUnpaidCount ?? 0);

  // If initial load and no data has arrived yet
  const showInitialSkeleton =
    loading &&
    displayTodayTotal === 0 &&
    displayRangeTotal === 0 &&
    displayRangePaymentCount === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* ================= CARD 1: TODAY'S COLLECTION ================= */}
      <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Today's Collection
            </span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-5" />
            </div>
          </div>
          {showInitialSkeleton ? (
            <div className="mt-2 h-9 w-32 bg-muted animate-pulse rounded-xl" />
          ) : (
            <div className="mt-2 font-mono text-2xl md:text-3xl font-extrabold text-foreground tracking-tight" data-no-translate>
              ₹{displayTodayTotal.toLocaleString("en-IN")}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-0 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            <strong className="text-emerald-600 font-bold font-mono" data-no-translate>{displayTodayCount}</strong>{" "}
            {displayTodayCount === 1 ? "payment" : "payments"} today
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] gap-1 rounded-full px-2 py-0.5 transition-all ${
              syncing
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
            }`}
          >
            {syncing ? (
              <>
                <Loader2 className="size-2.5 animate-spin" />
                Syncing
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live
              </>
            )}
          </Badge>
        </CardContent>
      </Card>

      {/* ================= CARD 2: SELECTED PERIOD ================= */}
      <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Selected Period
            </span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="size-5" />
            </div>
          </div>
          {showInitialSkeleton ? (
            <div className="mt-2 h-9 w-32 bg-muted animate-pulse rounded-xl" />
          ) : (
            <div className="mt-2 font-mono text-2xl md:text-3xl font-extrabold text-foreground tracking-tight" data-no-translate>
              ₹{displayRangeTotal.toLocaleString("en-IN")}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-0 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            <strong className="text-blue-600 font-bold font-mono" data-no-translate>{displayRangePaymentCount}</strong>{" "}
            {displayRangePaymentCount === 1 ? "transaction" : "transactions"} in period
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-medium max-w-[130px] truncate rounded-full"
          >
            {periodLabel}
          </Badge>
        </CardContent>
      </Card>

      {/* ================= CARD 3: METHOD BREAKDOWN ================= */}
      <Card className="relative overflow-hidden rounded-3xl border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Method Breakdown
            </span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Smartphone className="size-5" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-medium">CASH</span>
              <strong className="font-mono font-bold text-foreground" data-no-translate>
                ₹{cashAmount.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="h-6 w-px bg-border/80" />
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-medium">UPI</span>
              <strong className="font-mono font-bold text-foreground" data-no-translate>
                ₹{upiAmount.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="h-6 w-px bg-border/80" />
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-medium">CARD/OTH</span>
              <strong className="font-mono font-bold text-foreground" data-no-translate>
                ₹{otherAmount.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-1 text-[11px] text-muted-foreground">
          Cash & digital collections in selected range
        </CardContent>
      </Card>

      {/* ================= CARD 4: DELIVERED UNPAID ================= */}
      <Card
        onClick={onViewUnpaid}
        className="relative overflow-hidden rounded-3xl border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="size-3.5" /> Delivered Unpaid
            </span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <PackageCheck className="size-5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl md:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight" data-no-translate>
            ₹{displayDeliveredUnpaidTotalBalance.toLocaleString("en-IN")}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-xs text-muted-foreground flex items-center justify-between">
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            <span className="font-mono" data-no-translate>{displayDeliveredUnpaidCount}</span>{" "}
            {displayDeliveredUnpaidCount === 1 ? "order" : "orders"} pending
          </span>
          <span className="text-[11px] underline font-medium text-muted-foreground group-hover:text-primary transition">Click to view →</span>
        </CardContent>
      </Card>
    </div>
  );
}
