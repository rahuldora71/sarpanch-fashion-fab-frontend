import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Scissors,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  Layers,
  FileText,
  MapPin,
  Phone,
  Copy,
  Check,
  Send,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  orderTrackingService,
  type PublicOrderTrackingResponse,
} from "@/services/orderTrackingService";
import type { Invoice } from "@/types/billingModule";
import { InvoicePrintModal } from "@/components/billing/InvoicePrintModal";

export default function CustomerOrderTrackingPage() {
  const { trackingToken: paramToken } = useParams<{ trackingToken?: string }>();
  const navigate = useNavigate();

  // Search input state if user navigates to /track without a token
  const [inputToken, setInputToken] = useState("");
  const activeToken = (paramToken || "").trim();

  // Data states
  const [data, setData] = useState<PublicOrderTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review states
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);
  const [isTypingReview, setIsTypingReview] = useState(false);

  // Garment accordion states
  const [expandedGarments, setExpandedGarments] = useState<Record<number, boolean>>({});

  // Invoice modal state
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const reviewSectionRef = useRef<HTMLDivElement>(null);

  // Toggle dark/light theme
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Fetch tracking data
  const fetchTracking = async (token: string, isManualRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await orderTrackingService.trackOrder(token);
      setData(res);

      // If order already has a review, populate local review view
      if (res.review) {
        setRating(res.review.rating);
        setComment(res.review.comment || "");
      }

      // Auto-expand first garment if there's only 1 or 2
      if (res.garments && res.garments.length <= 2) {
        const initialExpand: Record<number, boolean> = {};
        res.garments.forEach((g) => {
          initialExpand[g.garmentId] = true;
        });
        setExpandedGarments(initialExpand);
      }

      if (isManualRefresh) {
        toast.success("Order status refreshed!");
      }
    } catch (err: any) {
      console.error("Tracking fetch error:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not retrieve order details. Please verify your tracking link or order number.";
      setError(msg);
      if (isManualRefresh) {
        toast.error("Failed to refresh order status.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeToken) {
      fetchTracking(activeToken);
    } else {
      setLoading(false);
    }
  }, [activeToken]);

  // Handle manual token search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    navigate(`/track/${encodeURIComponent(inputToken.trim())}`);
  };

  // Toggle garment expand/collapse
  const toggleGarment = (garmentId: number) => {
    setExpandedGarments((prev) => ({
      ...prev,
      [garmentId]: !prev[garmentId],
    }));
  };

  // Copy tracking link to clipboard
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tracking link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Handle invoice download / view
  const handleViewInvoice = async () => {
    if (!activeToken) return;
    setLoadingInvoice(true);
    try {
      const inv = await orderTrackingService.getInvoice(activeToken);
      setInvoice(inv);
      setInvoiceModalOpen(true);
    } catch (err) {
      console.error("Invoice fetch error:", err);
      toast.error("Unable to load invoice at this time.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken || rating === 0) {
      toast.error("Please select a star rating between 1 and 5.");
      return;
    }

    setSubmittingReview(true);
    try {
      const createdReview = await orderTrackingService.submitReview(activeToken, {
        rating,
        comment: comment.trim(),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              review: createdReview,
              canReview: false,
            }
          : null
      );
      setReviewSubmittedSuccess(true);
      toast.success("Thank you! Your review has been submitted.");
    } catch (err: any) {
      console.error("Review submission error:", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to submit review. A review might already have been submitted.";
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Smooth scroll to review section
  const scrollToReview = () => {
    reviewSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rating label helper
  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return "1 Star - Needs Improvement";
      case 2:
        return "2 Stars - Fair";
      case 3:
        return "3 Stars - Good Fit";
      case 4:
        return "4 Stars - Great Craftsmanship!";
      case 5:
        return "5 Stars - Perfect & Exquisite!";
      default:
        return "Select your rating";
    }
  };

  // Format currency
  const formatINR = (val?: number) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  // =========================================================
  // VIEW: NO TOKEN ENTERED (SEARCH SCREEN)
  // =========================================================
  if (!activeToken) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 font-sans">
        {/* Header */}
        <header className="max-w-md mx-auto w-full pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/brand/logo-badge.png"
              alt="Sarpanch Fashion Fab"
              className="w-20 h-20 object-contain drop-shadow-md rounded-full bg-white p-1"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
            Sarpanch Fashion Fab
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Bespoke Tailoring & Designer Studio
          </p>
        </header>

        {/* Search Card */}
        <main className="max-w-md mx-auto w-full my-auto">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Track Your Order</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Enter your Order Number or secure tracking code from your WhatsApp/SMS receipt to view live tailoring progress, balance, and download your bill.
            </p>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label htmlFor="tokenInput" className="block text-xs font-semibold text-foreground mb-1.5">
                  Order Number or Tracking Code
                </label>
                <input
                  id="tokenInput"
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="e.g. 1042 or sff_abc123"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition touch-manipulation"
              >
                Track My Order
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-md mx-auto w-full py-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Sarpanch Fashion Fab. All rights reserved.
        </footer>
      </div>
    );
  }

  // =========================================================
  // VIEW: LOADING SKELETON
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between py-4 animate-pulse">
          <div className="h-6 w-36 bg-muted rounded-md" />
          <div className="h-8 w-8 bg-muted rounded-full" />
        </div>

        <div className="space-y-4 mt-4 animate-pulse">
          <div className="h-32 bg-card border border-border rounded-2xl" />
          <div className="h-44 bg-card border border-border rounded-2xl" />
          <div className="h-56 bg-card border border-border rounded-2xl" />
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW: ERROR STATE (WITH RETRY)
  // =========================================================
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto w-full font-sans">
        <header className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-2">
            <Scissors className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black tracking-tight uppercase">Sarpanch Fashion Fab</h1>
        </header>

        <main className="my-auto text-center px-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
            {error || "We could not find an order matching this link. The link may have expired or is incorrect."}
          </p>

          <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
            <button
              onClick={() => fetchTracking(activeToken)}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Now
            </button>
            <button
              onClick={() => navigate("/track")}
              className="w-full py-3 px-4 rounded-xl bg-muted/60 text-foreground font-medium text-xs hover:bg-muted transition"
            >
              Enter Order Number Manually
            </button>
          </div>
        </main>

        <footer className="py-4 text-center text-[11px] text-muted-foreground">
          Need help? Contact the shop at +91 98765 43210
        </footer>
      </div>
    );
  }

  // Current status styling
  const statusConfig = {
    BOOKED: {
      label: "Order Booked",
      desc: "Order confirmed & placed in tailoring queue",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-500",
    },
    IN_PROGRESS: {
      label: "In Tailoring",
      desc: data.currentStage || "Cutting and handcrafting in progress",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      dotClass: "bg-blue-500 animate-pulse",
    },
    READY: {
      label: "Ready for Pickup",
      desc: "Pressed, quality checked & ready for trial",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    },
    DELIVERED: {
      label: "Delivered",
      desc: "Handed over to customer",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      dotClass: "bg-purple-500",
    },
  }[data.status] || {
    label: data.statusLabel || "In Progress",
    desc: data.currentStage,
    badgeClass: "bg-primary/10 text-primary border-primary/30",
    dotClass: "bg-primary",
  };

  const isDelivered = data.isDelivered || data.status === "DELIVERED";
  const hasReview = !!data.review || reviewSubmittedSuccess;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pb-28 sm:pb-12 antialiased selection:bg-primary/20">
      {/* =========================================================
          TOP NAVIGATION BAR (LIGHTWEIGHT, BRANDED, NO ADMIN MENUS)
      ========================================================= */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/80 px-4 py-3 sm:py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-primary/20 shadow-xs flex-shrink-0">
              <img
                src="/icons/icon-192.png"
                alt="Sarpanch Fashion Fab"
                className="size-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-foreground uppercase flex items-center gap-1.5">
                Sarpanch Fashion Fab
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                Customer Order Tracking
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition touch-manipulation"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Refresh button */}
            <button
              onClick={() => fetchTracking(activeToken, true)}
              disabled={refreshing}
              aria-label="Refresh status"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN SINGLE-COLUMN CONTENT CONTAINER
      ========================================================= */}
      <main className="max-w-lg mx-auto w-full px-4 pt-4 sm:pt-6 space-y-4 flex-1">
        {/* =========================================================
            1. ABOVE-THE-FOLD ORDER HERO CARD
        ========================================================= */}
        <section className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-0 pointer-events-none" />

          <div className="relative z-10">
            {/* Top Row: Reference + Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Order Reference
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight font-mono">
                    #{data.orderNumber}
                  </h1>
                  <button
                    onClick={handleCopyLink}
                    aria-label="Copy tracking link"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-tight shadow-xs ${statusConfig.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                <span>{statusConfig.label}</span>
              </div>
            </div>

            {/* Stage Description & Customer Greeting */}
            <div className="bg-muted/40 rounded-xl p-3 border border-border/60 mb-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {data.currentStage || "Order In Production"}
                </span>
                <span className="text-primary font-mono font-bold">
                  {data.progressPercentage}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(8, data.progressPercentage)}%` }}
                />
              </div>

              {/* Estimated date subtext */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                <span>Ordered: {new Date(data.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                {data.estimatedDeliveryDate && (
                  <span className="font-medium text-foreground">
                    Target: {new Date(data.estimatedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Name and Refreshed Timestamp */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
              <span>Customer: <strong className="text-foreground">{data.customerName}</strong></span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/70" />
                Updated {new Date(data.lastRefreshedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. COMPACT PAYMENT SUMMARY CARD
        ========================================================= */}
        <section className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              Payment Summary
            </h2>
            {data.financials.isFullyPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                Fully Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                Balance Pending
              </span>
            )}
          </div>

          {/* Financial Breakdown Grid (Single-column / compact mobile friendly) */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-xl border border-border/60 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Total</span>
              <span className="text-sm sm:text-base font-bold text-foreground font-mono mt-0.5">
                {formatINR(data.financials.totalAmount)}
              </span>
            </div>
            <div className="flex flex-col border-x border-border/60 px-1">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Paid</span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatINR(data.financials.amountPaid)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Due</span>
              <span
                className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                  data.financials.balanceDue > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {formatINR(data.financials.balanceDue)}
              </span>
            </div>
          </div>

          {/* Prominent Balance Alert if balance is due */}
          {data.financials.balanceDue > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between text-xs text-destructive">
              <span className="font-semibold">Balance due at delivery:</span>
              <span className="font-black font-mono text-sm">{formatINR(data.financials.balanceDue)}</span>
            </div>
          )}

          {/* Quick Invoice Download Action inside card */}
          <div className="mt-3.5 pt-3 border-t border-border/50">
            <button
              onClick={handleViewInvoice}
              disabled={loadingInvoice}
              className="w-full py-2.5 px-3 rounded-xl bg-muted/70 hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center gap-2 border border-border/80 transition touch-manipulation active:scale-[0.99]"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              {loadingInvoice ? "Loading Bill..." : "View / Download Bill PDF"}
            </button>
          </div>
        </section>

        {/* =========================================================
            3. COMPACT PRODUCTION PROGRESS (VERTICAL TIMELINE)
        ========================================================= */}
        <section className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Tailoring Milestones
          </h2>

          <div className="relative pl-6 space-y-5">
            {/* Continuous Vertical Timeline Track */}
            <div className="absolute left-2.5 top-2 bottom-3 w-0.5 bg-border/70" />

            {data.timeline.map((stage, idx) => {
              const isCompleted = stage.state === "COMPLETED";
              const isCurrent = stage.state === "CURRENT";

              return (
                <div key={stage.stageKey || idx} className="relative flex items-start gap-3">
                  {/* Milestone Marker */}
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                        : isCurrent
                        ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                        : "bg-background border-border text-muted-foreground/40"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isCompleted
                            ? "text-foreground"
                            : isCurrent
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.title}
                      </span>
                      {stage.timestamp && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {stage.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            4. MOBILE-FRIENDLY ORDER DETAILS (GARMENTS ACCORDION)
        ========================================================= */}
        <section className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-primary" />
              Garment Items ({data.garments.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">Tap to inspect</span>
          </div>

          <div className="space-y-2.5">
            {data.garments.map((garment, idx) => {
              const isExpanded = !!expandedGarments[garment.garmentId];

              return (
                <div
                  key={garment.garmentId}
                  className="border border-border/80 rounded-xl overflow-hidden bg-background/50 transition"
                >
                  {/* Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleGarment(garment.garmentId)}
                    className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition touch-manipulation"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {garment.serviceName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          {garment.customerFabric ? "Customer Cloth" : "Shop Fabric"}
                          {garment.sampleNumber && ` · Sample #${garment.sampleNumber}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-foreground border border-border/60">
                        {garment.statusLabel}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-border/60 bg-muted/20 space-y-2.5 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Stitching Price</span>
                          <span className="font-semibold text-foreground font-mono">{formatINR(garment.price)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Fabric Source</span>
                          <span className="font-semibold text-foreground">{garment.fabricSourceLabel}</span>
                        </div>
                        {garment.tryDate && (
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Trial Date</span>
                            <span className="font-semibold text-foreground">
                              {new Date(garment.tryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        )}
                        {garment.dueDate && (
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Delivery Target</span>
                            <span className="font-semibold text-foreground">
                              {new Date(garment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Add-ons list if any */}
                      {garment.addOns && garment.addOns.length > 0 && (
                        <div className="pt-1.5 border-t border-border/50">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                            Included Add-ons / Customizations:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {garment.addOns.map((addOnName, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground border border-border/60"
                              >
                                {addOnName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            5. DELIVERY SUCCESS BANNER (IF ORDER DELIVERED)
        ========================================================= */}
        {isDelivered && (
          <section className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-sm text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Order Handed Over Successfully!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              We hope your custom garment fits perfectly. Please share your rating and review below!
            </p>
          </section>
        )}

        {/* =========================================================
            6. REVIEW SECTION (SAVED OR SUBMISSION FORM)
        ========================================================= */}
        <section
          ref={reviewSectionRef}
          className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Customer Feedback & Review
            </h2>
            {hasReview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold border border-border">
                Review Submitted ✓
              </span>
            )}
          </div>

          {/* STATE A: REVIEW ALREADY SUBMITTED (LOCKED VIEW) */}
          {hasReview ? (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <Star
                    key={starVal}
                    className={`w-5 h-5 ${
                      starVal <= (data.review?.rating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-foreground ml-2">
                  {getRatingLabel(data.review?.rating || rating)}
                </span>
              </div>

              {(data.review?.comment || comment) ? (
                <p className="text-xs text-foreground bg-background/60 p-3 rounded-lg border border-border/50 leading-relaxed italic">
                  "{data.review?.comment || comment}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No written comment provided.</p>
              )}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                <span>By: {data.review?.customerName || data.customerName}</span>
                <span>
                  {data.review?.createdAt
                    ? new Date(data.review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Submitted"}
                </span>
              </div>
            </div>
          ) : (
            /* STATE B: REVIEW SUBMISSION FORM */
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                How was your tailoring and fit experience with Sarpanch Fashion Fab? Your feedback helps us maintain bespoke perfection.
              </p>

              {/* Touch-friendly 5-Star Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Select Rating:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (hoverRating || rating);

                    return (
                      <button
                        key={starVal}
                        type="button"
                        aria-label={`Rate ${starVal} star${starVal > 1 ? "s" : ""}`}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-2 sm:p-2.5 rounded-xl hover:bg-muted/80 active:scale-95 transition touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-150 ${
                            isFilled
                              ? "text-amber-400 fill-amber-400 scale-110 drop-shadow-xs"
                              : "text-muted-foreground/30 hover:text-amber-400/60"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-foreground mt-1.5 h-4">
                  {getRatingLabel(hoverRating || rating)}
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1.5">
                  <label htmlFor="reviewComment">Your Feedback (Optional)</label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  id="reviewComment"
                  rows={3}
                  value={comment}
                  maxLength={500}
                  onFocus={() => setIsTypingReview(true)}
                  onBlur={() => setIsTypingReview(false)}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the fabric fit, stitching quality, or timeliness..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview || rating === 0}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 touch-manipulation"
              >
                {submittingReview ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Shop Contact Footer Card */}
        <section className="bg-muted/30 border border-border/60 rounded-2xl p-4 text-center space-y-1.5 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Sarpanch Fashion Fab Studio</div>
          <div className="flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span>Main Market, Jaipur, Rajasthan</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span>For queries, WhatsApp us at +91 98765 43210</span>
          </div>
        </section>
      </main>

      {/* =========================================================
          7. OPTIONAL MOBILE BOTTOM ACTION BAR
          Respects safe-area, hides when keyboard is open (isTypingReview)
      ========================================================= */}
      {!isTypingReview && (
        <aside
          aria-label="Quick mobile order actions"
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
        >
          <div className="max-w-lg mx-auto flex items-center gap-2.5">
            <button
              onClick={handleViewInvoice}
              disabled={loadingInvoice}
              className="flex-1 py-2.5 px-3 rounded-xl bg-muted text-foreground border border-border font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition touch-manipulation"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Download Bill
            </button>

            {!hasReview && (
              <button
                onClick={scrollToReview}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition touch-manipulation"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                Review Order
              </button>
            )}
          </div>
        </aside>
      )}

      {/* =========================================================
          INVOICE PRINT / PREVIEW MODAL
      ========================================================= */}
      {invoiceModalOpen && invoice && (
        <InvoicePrintModal
          invoice={invoice}
          config={null}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
}
