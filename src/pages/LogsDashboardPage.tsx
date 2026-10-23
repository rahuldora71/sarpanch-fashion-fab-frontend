import React, { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Smartphone,
  Eye,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Activity,
  User,
  Monitor,
  Tablet,
  ArrowUpRight,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  communicationService,
  type MessageLog,
  type OrderAccessLog,
  type AuditLog,
  type CommunicationStats,
} from "@/services/communicationService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LogsDashboardPage() {
  const [activeTab, setActiveTab] = useState<"messages" | "access" | "audit" | "send">("messages");

  // Data states
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<OrderAccessLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Loading & pagination
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deviceFilter, setDeviceFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Preview Dialog State
  const [previewLog, setPreviewLog] = useState<MessageLog | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Quick Send State
  const [sendForm, setSendForm] = useState({
    orderNumber: "",
    customerName: "",
    phone: "",
    channel: "WHATSAPP",
    messageType: "ORDER_CONFIRMATION",
    customMessage: "",
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch KPI statistics
  const fetchStats = async () => {
    try {
      const data = await communicationService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Fetch tab data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === "messages") {
        const res = await communicationService.getMessageLogs({
          page,
          size: 15,
          search: search || undefined,
          channel: channelFilter !== "ALL" ? channelFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMessageLogs(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } else if (activeTab === "access") {
        const res = await communicationService.getAccessLogs({
          page,
          size: 15,
          search: search || undefined,
          deviceType: deviceFilter !== "ALL" ? deviceFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setAccessLogs(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } else if (activeTab === "audit") {
        const res = await communicationService.getAuditLogs({
          page,
          size: 15,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setAuditLogs(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
      toast.error("Failed to load logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, page, search, channelFilter, statusFilter, deviceFilter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchData(true)]);
    toast.success("Logs and metrics refreshed!");
  };

  // Copy tracking link
  const handleCopyLink = (url?: string, logId?: number) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    if (logId) {
      setCopiedId(logId);
      setTimeout(() => setCopiedId(null), 2000);
    }
    toast.success("Customer tracking link copied to clipboard!");
  };

  // Launch WhatsApp directly
  const handleLaunchWhatsApp = (log: MessageLog) => {
    let cleanPhone = log.recipientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const fullTrackingUrl = log.trackingUrl?.startsWith("http")
      ? log.trackingUrl
      : `${window.location.origin}${log.trackingUrl}`;

    const text = encodeURIComponent(
      log.messageContent.replace(log.trackingUrl || "", fullTrackingUrl)
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${text}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success("Opened WhatsApp with pre-filled message!");
  };

  // Handle Quick Send Form Submit
  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.phone) {
      toast.error("Please provide a phone number.");
      return;
    }

    setSendingMessage(true);
    try {
      const res = await communicationService.sendWhatsApp({
        orderId: sendForm.orderNumber ? Number(sendForm.orderNumber) : undefined,
        customerName: sendForm.customerName || undefined,
        phone: sendForm.phone,
        channel: sendForm.channel as any,
        messageType: sendForm.messageType,
        customMessage: sendForm.customMessage || undefined,
      });

      toast.success("Notification logged! Opening WhatsApp...");
      window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");

      // Reset & refresh
      setSendForm({
        orderNumber: "",
        customerName: "",
        phone: "",
        channel: "WHATSAPP",
        messageType: "ORDER_CONFIRMATION",
        customMessage: "",
      });
      setActiveTab("messages");
      fetchStats();
      fetchData();
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error("Failed to prepare WhatsApp message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    switch (device?.toUpperCase()) {
      case "MOBILE":
        return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
      case "TABLET":
        return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 font-sans">
      {/* =========================================================
          PAGE HEADER WITH LOGO EMBLEM & ACTIONS
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              Communication & Access Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              WhatsApp / SMS notifications dispatch logs, customer tracking link visits, and staff audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("send")}
            className="py-2 px-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-98 transition"
          >
            <Send className="w-4 h-4" />
            Send WhatsApp
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="py-2 px-3 rounded-xl border border-border bg-card text-foreground font-medium text-xs sm:text-sm flex items-center gap-1.5 hover:bg-muted/60 transition disabled:opacity-50"
            title="Refresh logs & statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* =========================================================
          KPI ANALYTICS CARDS (CLICK-THROUGH, VISITS, SENT)
      ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Messages Sent */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Messages Sent</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
            {stats?.totalMessages ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {stats?.todayMessages ?? 0} Today
            </span>
            <span>· {stats?.whatsappCount ?? 0} WhatsApp</span>
          </div>
        </div>

        {/* Card 2: Tracking Links Opened / Clicked */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Links Opened</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats?.clickedCount ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {stats?.clickThroughRate ?? 0}%
            </span>
            <span>Customer Open Rate</span>
          </div>
        </div>

        {/* Card 3: Total Customer Link Visits */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Visits</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
            {stats?.totalCustomerAccesses ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {stats?.todayAccesses ?? 0} visits today
            </span>
          </div>
        </div>

        {/* Card 4: WhatsApp vs SMS Ratio */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Channels</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground flex items-center gap-2">
            <span>{stats?.whatsappCount ?? 0}</span>
            <span className="text-xs text-muted-foreground font-normal">/ {stats?.smsCount ?? 0} SMS</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Automated customer touchpoints
          </div>
        </div>
      </div>

      {/* =========================================================
          NAVIGATION TABS
      ========================================================= */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setActiveTab("messages"); setPage(0); }}
          className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "messages"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Message Sent Logs ({stats?.totalMessages ?? 0})
        </button>

        <button
          onClick={() => { setActiveTab("access"); setPage(0); }}
          className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "access"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Eye className="w-4 h-4" />
          Customer Access Logs ({stats?.totalCustomerAccesses ?? 0})
        </button>

        <button
          onClick={() => { setActiveTab("audit"); setPage(0); }}
          className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "audit"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Shield className="w-4 h-4" />
          Staff Security Audit
        </button>

        <button
          onClick={() => setActiveTab("send")}
          className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "send"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Send Custom Notification
        </button>
      </div>

      {/* =========================================================
          TAB 1: MESSAGE SENT LOGS (WHATSAPP & SMS)
      ========================================================= */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by customer name, phone, or order #..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Dropdowns & Date inputs */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-xs font-medium text-foreground focus:outline-none"
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-xs font-medium text-foreground focus:outline-none"
                title="End Date"
              />

              <select
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="WHATSAPP">WhatsApp Only</option>
                <option value="SMS">SMS Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="CLICKED">Link Clicked / Opened</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SENT">Sent</option>
              </select>
            </div>
          </div>

          {/* Table / Cards Container */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading message logs...</div>
            ) : messageLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No message logs found</p>
                <p className="text-xs">Try clearing filters or send a WhatsApp notification from the tab above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-3">Channel</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Sent At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {messageLogs.map((log) => {
                      const isClicked = log.status === "CLICKED";

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition">
                          {/* Customer */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-foreground block">{log.customerName || "Customer"}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{log.recipientPhone}</span>
                          </td>

                          {/* Order */}
                          <td className="py-3 px-3">
                            {log.orderNumber ? (
                              <span className="font-mono font-bold text-primary">#{log.orderNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Channel Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                log.channel === "WHATSAPP"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {log.channel}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground">
                              {log.messageType?.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            {isClicked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                <Eye className="w-3 h-3" />
                                Link Opened
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-semibold">
                                <Check className="w-3 h-3" />
                                {log.status}
                              </span>
                            )}
                          </td>

                          {/* Sent At */}
                          <td className="py-3 px-3 text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(log.sentAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Message */}
                              <button
                                onClick={() => setPreviewLog(log)}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
                                title="Preview Message Content"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy Link */}
                              {log.trackingUrl && (
                                <button
                                  onClick={() => handleCopyLink(log.trackingUrl, log.id)}
                                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
                                  title="Copy Customer Tracking Link"
                                >
                                  {copiedId === log.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Resend WhatsApp */}
                              {log.channel === "WHATSAPP" && (
                                <button
                                  onClick={() => handleLaunchWhatsApp(log)}
                                  className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                                  title="Resend via WhatsApp Web / App"
                                >
                                  <Send className="w-3 h-3" />
                                  WhatsApp
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                <span>
                  Page {page + 1} of {totalPages} ({totalElements} total entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: CUSTOMER ACCESS LOGS (WHO ACCESSED LINK)
      ========================================================= */}
      {activeTab === "access" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by customer, IP address, or order #..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <select
              value={deviceFilter}
              onChange={(e) => { setDeviceFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="ALL">All Devices</option>
              <option value="MOBILE">Mobile Phones Only</option>
              <option value="TABLET">Tablets Only</option>
              <option value="DESKTOP">Desktop Only</option>
            </select>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading access logs...</div>
            ) : accessLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <Eye className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No tracking link visits logged yet</p>
                <p className="text-xs">When a customer taps their WhatsApp tracking link, it will appear here in real time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Order Reference</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Device</th>
                      <th className="py-3 px-3">IP Address</th>
                      <th className="py-3 px-3">Browser / Platform</th>
                      <th className="py-3 px-4 text-right">Visited At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {accessLogs.map((acc) => (
                      <tr key={acc.id} className="hover:bg-muted/30 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary block">
                            {acc.orderNumber ? `#${acc.orderNumber}` : "Direct Link"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {acc.trackingToken?.substring(0, 16)}...
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {acc.customerName || "Customer"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                            {getDeviceIcon(acc.deviceType)}
                            {acc.deviceType || "Mobile"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                          {acc.ipAddress}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-muted-foreground max-w-xs truncate" title={acc.userAgent}>
                          {acc.userAgent || "Customer Mobile Browser"}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(acc.accessedAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                <span>
                  Page {page + 1} of {totalPages} ({totalElements} total entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: STAFF & SYSTEM AUDIT LOGS
      ========================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search staff action or details..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading audit trail...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <Shield className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-3">Action</th>
                      <th className="py-3 px-3">Target Entity</th>
                      <th className="py-3 px-3">Details</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition">
                        <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {log.userName || "System"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-muted-foreground">
                          {log.entityName} #{log.entityId}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-muted-foreground max-w-sm truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                <span>
                  Page {page + 1} of {totalPages} ({totalElements} total entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: QUICK WHATSAPP NOTIFICATION SENDER
      ========================================================= */}
      {activeTab === "send" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Send WhatsApp Tracking Update</h2>
              <p className="text-xs text-muted-foreground">
                Dispatches a tailored WhatsApp template with live order tracking and bill download link.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Order Number (Optional)</label>
                <input
                  type="number"
                  value={sendForm.orderNumber}
                  onChange={(e) => setSendForm({ ...sendForm, orderNumber: e.target.value })}
                  placeholder="e.g. 1042"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={sendForm.customerName}
                  onChange={(e) => setSendForm({ ...sendForm, customerName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Recipient Phone Number *</label>
              <input
                type="text"
                value={sendForm.phone}
                onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                placeholder="10-digit mobile number, e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Message Template Type</label>
              <select
                value={sendForm.messageType}
                onChange={(e) => setSendForm({ ...sendForm, messageType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none"
              >
                <option value="ORDER_CONFIRMATION">Order Confirmation & Tracking Link</option>
                <option value="READY_FOR_TRIAL">Ready for Trial & Fitting Reminder</option>
                <option value="DELIVERED">Order Delivered & Feedback Request</option>
                <option value="INVOICE_BILL">Invoice / Bill Download Link</option>
                <option value="CUSTOM">Custom Message</option>
              </select>
            </div>

            {sendForm.messageType === "CUSTOM" && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Custom Message Body</label>
                <textarea
                  rows={4}
                  value={sendForm.customMessage}
                  onChange={(e) => setSendForm({ ...sendForm, customMessage: e.target.value })}
                  placeholder="Write message to customer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={sendingMessage}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendingMessage ? "Generating WhatsApp Link..." : "Open WhatsApp & Send Message"}
            </button>
          </form>
        </div>
      )}

      {/* =========================================================
          PREVIEW MESSAGE DIALOG
      ========================================================= */}
      {previewLog && (
        <Dialog open={!!previewLog} onOpenChange={() => setPreviewLog(null)}>
          <DialogContent className="max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Message Content Preview
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
                <span>To: <strong className="text-foreground">{previewLog.customerName}</strong> ({previewLog.recipientPhone})</span>
                <span className="font-mono text-primary font-bold">#{previewLog.orderNumber || "General"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {previewLog.messageContent}
              </div>

              {previewLog.trackingUrl && (
                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[240px]">
                    {window.location.origin}{previewLog.trackingUrl}
                  </span>
                  <button
                    onClick={() => handleCopyLink(previewLog.trackingUrl)}
                    className="p-1 rounded-md text-primary hover:bg-muted transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {previewLog.channel === "WHATSAPP" && (
                  <button
                    onClick={() => handleLaunchWhatsApp(previewLog)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Open in WhatsApp
                  </button>
                )}
                <button
                  onClick={() => setPreviewLog(null)}
                  className="py-2 px-3.5 rounded-xl bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
