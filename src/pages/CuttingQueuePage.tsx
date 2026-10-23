import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Scissors, Sparkles } from "lucide-react";
import CuttingDateGroupSection from "@/components/cutting/CuttingDateGroupSection";
import { getCuttingQueue } from "@/services/cuttingService";
import type {
  CuttingQueueResponse,
  CuttingDateGroup,
  CuttingQueueTab,
} from "@/types/cutting";

/**
 * Cutting Queue Page.
 *
 * Shows all garments waiting to be cut, sorted by due date.
 * Tab filters: All | Today | Tomorrow | Upcoming | Overdue
 * Clicking an order navigates to the dedicated Cutting Workspace page.
 */
export default function CuttingQueuePage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<CuttingQueueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CuttingQueueTab>("all");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCuttingQueue();
      setQueue(data);
    } catch {
      setError("Failed to load cutting queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Filter date groups based on active tab
  const filteredGroups: CuttingDateGroup[] = queue?.dateGroups.filter((group) => {
    if (activeTab === "all") return true;
    if (activeTab === "today") return group.isToday;
    if (activeTab === "tomorrow") return group.isTomorrow;
    if (activeTab === "overdue") return group.isOverdue;
    if (activeTab === "upcoming")
      return !group.isToday && !group.isTomorrow && !group.isOverdue;
    return true;
  }) ?? [];

  const overdueCount =
    queue?.dateGroups.reduce(
      (sum, g) => sum + (g.isOverdue ? g.garmentCount : 0),
      0
    ) ?? 0;

  const todayCount =
    queue?.dateGroups.find((g) => g.isToday)?.garmentCount ?? 0;

  const tomorrowCount =
    queue?.dateGroups.find((g) => g.isTomorrow)?.garmentCount ?? 0;

  const upcomingCount =
    queue?.dateGroups.reduce(
      (sum, g) =>
        sum + (!g.isToday && !g.isTomorrow && !g.isOverdue ? g.garmentCount : 0),
      0
    ) ?? 0;

  const openWorkspace = (orderId: number) => {
    navigate(`/cutting-queue/${orderId}`);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* PAGE HEADER */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <Scissors className="size-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Cutting Queue</h1>
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
                  मास्टर कटिंग
                </Badge>
              </div>
              {queue && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  <strong className="text-foreground font-semibold">{queue.totalGarmentsPending}</strong> garments pending cut •{" "}
                  <strong className="text-foreground font-semibold">{queue.totalOrdersPending}</strong> orders
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            className="h-10 rounded-xl border-border/80 text-xs font-semibold gap-2 shadow-xs hover:bg-accent"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh Queue</span>
          </Button>
        </div>

        {/* TAB FILTERS */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CuttingQueueTab)}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-5 w-full max-w-xl h-11 p-1 rounded-2xl bg-muted/60 border border-border/60">
            <TabsTrigger value="all" className="rounded-xl text-xs font-medium">
              All
              {queue && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {queue.totalGarmentsPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="today" className="rounded-xl text-xs font-medium">
              Today
              {todayCount > 0 && (
                <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                  {todayCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="rounded-xl text-xs font-medium">
              Tomorrow
              {tomorrowCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {tomorrowCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl text-xs font-medium">
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {upcomingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-xl text-xs font-medium">
              Overdue
              {overdueCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {overdueCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1">
        {/* Loading skeleton */}
        {loading && !queue && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-muted/60 border border-border/60 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-20 text-center space-y-4 rounded-3xl border border-border/80 bg-card p-8">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" className="rounded-xl" onClick={fetchQueue}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && queue && filteredGroups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center rounded-3xl border border-border/80 bg-card p-8 shadow-xs"
          >
            <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-sm shadow-primary/20">
              <Sparkles className="size-7" />
            </div>
            <p className="text-base font-bold text-foreground">No garments pending cutting</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {activeTab === "all"
                ? "All garments are cut or in stitching production."
                : `No ${activeTab} garments in the cutting queue.`}
            </p>
          </motion.div>
        )}

        {/* Queue groups */}
        {!error && filteredGroups.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <CuttingDateGroupSection
                  key={group.dueDate ?? "no-date"}
                  dateGroup={group}
                  onOpenWorkspace={openWorkspace}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
