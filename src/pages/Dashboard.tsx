import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Plus,
  Scissors,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  UserRound,
  Mail,
  CircleUserRound,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import type { RootState } from "@/app/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getPaymentAnalytics } from "@/services/paymentService";
import { orderService } from "@/services/orderService";
import { getCuttingQueue } from "@/services/cuttingService";
import { alterationService } from "@/services/alterationService";

import type { PaymentAnalytics } from "@/types/payment";
import type { OrderResponse } from "@/types/order";
import type { CuttingQueueResponse } from "@/types/cutting";
import type { AlterationQueueSummary } from "@/types/alteration";

import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import DeliveredUnpaidOrdersCard from "@/components/payments/DeliveredUnpaidOrdersCard";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user, expiresIn, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // =========================================================
  // STATE
  // =========================================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);

  // Operational Data
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [cuttingQueue, setCuttingQueue] = useState<CuttingQueueResponse | null>(null);
  const [alterationSummary, setAlterationSummary] = useState<AlterationQueueSummary | null>(null);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // User initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [analyticsRes, ordersRes, cuttingRes, alterationRes] =
        await Promise.allSettled([
          getPaymentAnalytics(),
          orderService.getAllOrders({ page: 0, size: 7, sort: "orderDate,desc" }),
          getCuttingQueue(),
          alterationService.getAlterationQueueSummary(),
        ]);

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.content) {
        setRecentOrders(ordersRes.value.content);
      }
      if (cuttingRes.status === "fulfilled") {
        setCuttingQueue(cuttingRes.value);
      }
      if (alterationRes.status === "fulfilled") {
        setAlterationSummary(alterationRes.value);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Auth Guard
  if (!isAuthenticated || !user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl border-border/80 shadow-md text-center p-6">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">Authentication Required</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Please log in to access the tailoring atelier workspace.
          </p>
          <Button
            className="mt-6 w-full rounded-xl bg-primary font-semibold"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in-50 duration-200">
      {/* =====================================================
          COMPACT ATELIER CONTROL DECK (HEADER + ACTIONS)
      ====================================================== */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 rounded-xl border border-border shadow-xs shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="rounded-xl text-sm font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {getGreeting()}, {user.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{todayFormatted}</span>
                <span>•</span>
                <span>Bespoke Tailoring Atelier Overview</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            className="h-8.5 rounded-xl border-border/80 text-xs font-medium gap-1.5 shadow-xs hover:bg-accent self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </Button>
        </div>

        {/* Quick Action Pills Row */}
        <div className="mt-3.5 pt-3.5 border-t border-border/60 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/orders/new")}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition active:scale-98"
          >
            <Plus className="size-3.5 mr-1" />
            <span>New Order (नया ऑर्डर)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigate("/orders/historical-entry")}
            className="h-9 px-3.5 rounded-xl text-xs font-medium border-border/80 bg-background hover:border-primary/50 hover:bg-primary/5 transition active:scale-98"
          >
            <FileText className="size-3.5 mr-1 text-primary" />
            <span>Mass Slip Upload (पर्ची)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigate("/customers")}
            className="h-9 px-3.5 rounded-xl text-xs font-medium border-border/80 bg-background hover:border-primary/50 hover:bg-primary/5 transition active:scale-98"
          >
            <Users className="size-3.5 mr-1 text-blue-500" />
            <span>Customers (ग्राहक)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPaymentModalOpen(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-medium border-border/80 bg-background hover:border-primary/50 hover:bg-primary/5 transition active:scale-98"
          >
            <CreditCard className="size-3.5 mr-1 text-emerald-500" />
            <span>Record Payment (भुगतान)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigate("/cutting-queue")}
            className="h-9 px-3.5 rounded-xl text-xs font-medium border-border/80 bg-background hover:border-primary/50 hover:bg-primary/5 transition active:scale-98"
          >
            <Scissors className="size-3.5 mr-1 text-amber-500" />
            <span>Cutting Queue (कटिंग)</span>
          </Button>
        </div>
      </div>

      {/* =====================================================
          COMPACT FOUR OPERATIONAL KPI TILES (~105px HEIGHT)
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Collection */}
        <Card className="rounded-2xl border-border/80 bg-card p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Today's Collection (आज की वसूली)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-no-translate>
              ₹{(analytics?.todayTotal ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>
                <strong className="text-foreground font-semibold font-mono" data-no-translate>{analytics?.todayCount ?? 0}</strong> payments today
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">Live</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Delivered But Unpaid */}
        <Card
          onClick={() => navigate("/payments?tab=unpaid")}
          className="rounded-2xl border-border/80 bg-card p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-rose-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Delivered Unpaid (बकाया राशि)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400" data-no-translate>
              ₹{(analytics?.deliveredUnpaidTotalBalance ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>
                <strong className="text-rose-600 dark:text-rose-400 font-semibold font-mono" data-no-translate>{analytics?.deliveredUnpaidCount ?? 0}</strong> orders pending
              </span>
              <span className="text-[10px] underline font-medium text-muted-foreground group-hover:text-primary">View →</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Cutting Queue */}
        <Card
          onClick={() => navigate("/cutting-queue")}
          className="rounded-2xl border-border/80 bg-card p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Cutting Queue (मास्टर कटिंग)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Scissors className="size-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-no-translate>
              {cuttingQueue?.totalGarmentsPending ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>
                Across <strong className="text-foreground font-semibold font-mono" data-no-translate>{cuttingQueue?.totalOrdersPending ?? 0}</strong> orders
              </span>
              <span className="text-[10px] underline font-medium text-muted-foreground group-hover:text-primary">Queue →</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Alterations & Fitting */}
        <Card
          onClick={() => navigate("/alterations")}
          className="rounded-2xl border-border/80 bg-card p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-purple-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Alterations (अल्टरेशन)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {alterationSummary?.totalActive ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>
                <strong className="text-purple-600 dark:text-purple-400 font-semibold">{alterationSummary?.dueToday ?? 0}</strong> due today
              </span>
              <span className="text-[10px] underline font-medium text-muted-foreground group-hover:text-primary">Fitting →</span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          COMPACT PRODUCTION LIFECYCLE FUNNEL (~75px HEIGHT)
      ====================================================== */}
      <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Production Stages / कार्यशाला चरण
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/production")}
            className="h-6 text-[11px] font-semibold text-primary hover:text-primary/80 gap-1 px-1.5"
          >
            <span>Production Board</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div
            onClick={() => navigate("/cutting-queue")}
            className="p-2.5 rounded-xl border border-border/70 bg-background hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>1. Fabric Cut</span>
              <span className="size-1.5 rounded-full bg-slate-400" />
            </div>
            <p className="mt-1 text-base font-bold font-mono text-foreground">
              {cuttingQueue?.totalGarmentsPending ?? 0}
            </p>
          </div>

          <div
            onClick={() => navigate("/production")}
            className="p-2.5 rounded-xl border border-border/70 bg-background hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>2. Master Cutting</span>
              <span className="size-1.5 rounded-full bg-blue-500" />
            </div>
            <p className="mt-1 text-base font-bold font-mono text-foreground">Active</p>
          </div>

          <div
            onClick={() => navigate("/production")}
            className="p-2.5 rounded-xl border border-border/70 bg-background hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>3. Stitching</span>
              <span className="size-1.5 rounded-full bg-amber-500" />
            </div>
            <p className="mt-1 text-base font-bold font-mono text-foreground">In Progress</p>
          </div>

          <div
            onClick={() => navigate("/production")}
            className="p-2.5 rounded-xl border border-border/70 bg-background hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>4. Ready / Trial</span>
              <span className="size-1.5 rounded-full bg-purple-500" />
            </div>
            <p className="mt-1 text-base font-bold font-mono text-foreground">Ready</p>
          </div>

          <div
            onClick={() => navigate("/orders")}
            className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-border/70 bg-background hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>5. Handover</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-1 text-base font-bold font-mono text-foreground">Delivered</p>
          </div>
        </div>
      </div>

      {/* =====================================================
          TWO-COLUMN OPERATIONAL BENTO (PULLED ABOVE THE FOLD)
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Column (7 cols): Recent Orders Stream */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-border/80 bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingBag className="size-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    Recent Atelier Orders (हाल के ऑर्डर)
                  </h3>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/orders")}
                className="h-7 text-xs font-semibold text-primary hover:text-primary/80 gap-1 px-2"
              >
                <span>View All ({recentOrders.length})</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading recent orders...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <ShoppingBag className="size-7 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-medium">No recent orders found</p>
                <Button
                  size="sm"
                  className="mt-2.5 h-8 rounded-xl bg-primary text-xs"
                  onClick={() => navigate("/orders/new")}
                >
                  Create First Order
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentOrders.map((order) => {
                  const orderDateFormatted = order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—";

                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="group -mx-1.5 flex items-center justify-between rounded-xl p-2.5 hover:bg-accent/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Order identifier badge */}
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/60 font-mono text-xs font-bold text-foreground group-hover:border-primary/50 transition">
                          <span>#{order.id}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
                              {order.customerName || "Walk-in Customer"}
                            </p>
                            {order.sampleBookPageNumber && (
                              <span className="font-mono text-[10px] rounded-md bg-muted px-1.5 py-0.2 text-muted-foreground">
                                P.{order.sampleBookPageNumber}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{order.customerCode}</span>
                            <span>•</span>
                            <span>{orderDateFormatted}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground group-hover:text-primary transition"
                        >
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): Delivered Unpaid Attention Widget */}
        <div className="lg:col-span-5 space-y-4">
          <DeliveredUnpaidOrdersCard compact={true} className="shadow-xs" />
        </div>
      </div>

      {/* =====================================================
          COMPACT ACCOUNT & DIAGNOSTICS ACCORDION
      ====================================================== */}
      <Card className="rounded-2xl border-border/80 bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setAccountDetailsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between p-3.5 sm:p-4 text-left transition hover:bg-accent/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Account & Security (खाता एवं सुरक्षा)
              </p>
              <p className="text-[10.5px] text-muted-foreground">
                User roles, login provider, and token expiry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span>{accountDetailsOpen ? "Hide" : "Show"}</span>
            {accountDetailsOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </div>
        </button>

        {accountDetailsOpen && (
          <div className="p-4 pt-2 border-t border-border/60 animate-in fade-in-50 duration-150">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <UserRound className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">User ID</p>
                  <p className="mt-0.5 font-mono text-xs font-bold">{user.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="mt-0.5 truncate text-xs font-bold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <CircleUserRound className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Provider</p>
                  <p className="mt-0.5 text-xs font-bold">{user.provider}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <KeyRound className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Token Expiry</p>
                  <p className="mt-0.5 font-mono text-xs font-bold">
                    {expiresIn ? `${Math.floor(expiresIn / 60)} min` : "Active"}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-3.5" />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Roles:</span>
                <div className="flex gap-1">
                  {user.roles?.map((role) => (
                    <Badge key={role.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono text-[10.5px]">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>Spring Security Authenticated</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* =====================================================
          RECORD PAYMENT MODAL TRIGGERED FROM DASHBOARD
      ====================================================== */}
      {paymentModalOpen && (
        <RecordPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false);
            fetchDashboardData(true);
          }}
        />
      )}
    </div>
  );
}