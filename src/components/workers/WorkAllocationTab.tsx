import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Scissors,
  CheckCircle2,
  UserCheck,
  Search,
  Layers,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  RefreshCw,
  Phone,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import {
  getWorkAllocations,
  allocateWorkToWorker,
  markAllocatedGarmentReady,
} from "@/services/workerService";
import type {
  Worker,
  WorkAllocationItem,
} from "@/types/worker";
import { garmentStatusColor, garmentStatusLabel } from "@/utils/productionUtils";
import type { GarmentStatus } from "@/types/order";

interface WorkAllocationTabProps {
  workers: Worker[];
  onWorkerUpdated?: () => void;
}

interface WorkerGroup {
  workerId: number;
  workerName: string;
  workerPhone?: string | null;
  workerImage?: string | null;
  workerSpecialty?: string | null;
  dailyCapacity?: number;
  garments: WorkAllocationItem[];
}

export function WorkAllocationTab({
  workers,
  onWorkerUpdated,
}: WorkAllocationTabProps) {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<WorkAllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"ALLOCATE" | "WORKER_LIST">("ALLOCATE");
  const [readyQueueMode, setReadyQueueMode] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [search, setSearch] = useState("");
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selection for bulk work allocation
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<number[]>([]);
  const [assigningWorkerId, setAssigningWorkerId] = useState<number | "">("");
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [togglingGarmentId, setTogglingGarmentId] = useState<number | null>(null);

  // Collapsed state for worker groups in Ready Queue
  const [collapsedWorkers, setCollapsedWorkers] = useState<Record<number, boolean>>({});

  const toggleWorkerCollapse = (workerId: number) => {
    setCollapsedWorkers((prev) => ({
      ...prev,
      [workerId]: !prev[workerId],
    }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkAllocations();
      setAllocations(data);
    } catch (err) {
      console.error("Failed to load work allocations:", err);
      toast.error("Could not load work allocations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // 1. PENDING ALLOTMENT LIST
  // Only show garments whose CUTTING status is DONE (cut by master),
  // not yet allotted to a worker (madeByWorkerId is null), and not FABRIC_CUT.
  // ============================================================
  const pendingAllocationList = useMemo(() => {
    return allocations.filter((item) => {
      // Must be cut by master: CUTTING status or cuttingByWorkerId is present
      // and NOT in un-cut FABRIC_CUT state without cutting
      const isCutByMaster =
        (item.status === "CUTTING" || item.cuttingByWorkerId !== null) &&
        item.status !== "FABRIC_CUT";
      const isUnallotted = !item.madeByWorkerId;
      const isPending = isCutByMaster && isUnallotted && item.status !== "CANCELLED";

      const matchesSearch =
        search.trim() === "" ||
        item.orderId.toString().includes(search.trim()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        (item.sampleBookPageNumber &&
          item.sampleBookPageNumber.toLowerCase().includes(search.toLowerCase())) ||
        (item.cuttingByWorkerName &&
          item.cuttingByWorkerName.toLowerCase().includes(search.toLowerCase()));

      return isPending && matchesSearch;
    });
  }, [allocations, search]);

  // ============================================================
  // 2. ACTIVE READY QUEUE (IN-PROGRESS WORK ALLOTTED TO WORKERS)
  // After allotment, garments go to the Ready Queue where they are
  // GROUPED ACCORDING TO THE WORKER.
  // When marked as READY, they are REMOVED from the active ready queue.
  // ============================================================
  const activeReadyQueueItems = useMemo(() => {
    return allocations.filter((item) => {
      const isAllocated = !!item.madeByWorkerId;
      // Active means currently being worked on (STITCHING, IRONING etc. - NOT yet READY or DELIVERED)
      const isActive =
        item.status !== "READY" &&
        item.status !== "DELIVERED" &&
        item.status !== "CANCELLED";
      const matchesWorker =
        selectedWorkerFilter === "ALL" || item.madeByWorkerId === selectedWorkerFilter;
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchesSearch =
        search.trim() === "" ||
        item.orderId.toString().includes(search.trim()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        (item.madeByWorkerName &&
          item.madeByWorkerName.toLowerCase().includes(search.toLowerCase()));

      return isAllocated && isActive && matchesWorker && matchesStatus && matchesSearch;
    });
  }, [allocations, selectedWorkerFilter, statusFilter, search]);

  // Completed items (for historical verification)
  const completedQueueItems = useMemo(() => {
    return allocations.filter((item) => {
      const isAllocated = !!item.madeByWorkerId;
      const isCompleted = item.status === "READY" || item.status === "DELIVERED";
      const matchesWorker =
        selectedWorkerFilter === "ALL" || item.madeByWorkerId === selectedWorkerFilter;
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchesSearch =
        search.trim() === "" ||
        item.orderId.toString().includes(search.trim()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        (item.madeByWorkerName &&
          item.madeByWorkerName.toLowerCase().includes(search.toLowerCase()));

      return isAllocated && isCompleted && matchesWorker && matchesStatus && matchesSearch;
    });
  }, [allocations, selectedWorkerFilter, statusFilter, search]);

  // Group active items according to worker
  const workerGroups = useMemo<WorkerGroup[]>(() => {
    const map = new Map<number, WorkerGroup>();

    for (const item of activeReadyQueueItems) {
      if (!item.madeByWorkerId) continue;
      const wid = item.madeByWorkerId;

      if (!map.has(wid)) {
        const workerEntity = workers.find((w) => w.id === wid);
        map.set(wid, {
          workerId: wid,
          workerName: item.madeByWorkerName || workerEntity?.name || `Worker #${wid}`,
          workerPhone: item.madeByWorkerPhone || workerEntity?.phone,
          workerImage: item.madeByWorkerImage || workerEntity?.imageUrl,
          workerSpecialty: item.madeByWorkerSpecialty || workerEntity?.workerSpecialty,
          dailyCapacity: workerEntity?.dailyCapacity,
          garments: [],
        });
      }

      map.get(wid)!.garments.push(item);
    }

    // Sort worker groups by number of garments descending
    return Array.from(map.values()).sort((a, b) => b.garments.length - a.garments.length);
  }, [activeReadyQueueItems, workers]);

  // Worker active load map: workerId -> count of active stitching/ironing garments
  const workerActiveLoad = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of allocations) {
      if (item.madeByWorkerId && item.status !== "READY" && item.status !== "DELIVERED") {
        map.set(item.madeByWorkerId, (map.get(item.madeByWorkerId) ?? 0) + 1);
      }
    }
    return map;
  }, [allocations]);

  // Toggle selection of a garment for allocation
  const handleToggleSelectGarment = (id: number) => {
    setSelectedGarmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    if (selectedGarmentIds.length === pendingAllocationList.length) {
      setSelectedGarmentIds([]);
    } else {
      setSelectedGarmentIds(pendingAllocationList.map((g) => g.garmentId));
    }
  };

  // Perform allocation
  const handleAllocate = async (targetWorkerId?: number, singleGarmentId?: number) => {
    const workerId = targetWorkerId ?? (assigningWorkerId ? Number(assigningWorkerId) : null);
    if (!workerId) {
      toast.error("Please select a worker to allocate work to");
      return;
    }

    const idsToAssign = singleGarmentId ? [singleGarmentId] : selectedGarmentIds;
    if (idsToAssign.length === 0) {
      toast.error("No garments selected for allocation");
      return;
    }

    const workerObj = workers.find((w) => w.id === workerId);
    setSubmittingAssign(true);
    try {
      await allocateWorkToWorker(workerId, idsToAssign);
      toast.success(
        `Allocated ${idsToAssign.length} garment${
          idsToAssign.length > 1 ? "s" : ""
        } to ${workerObj?.name ?? "Worker"}. Sent to Worker Ready Queue!`
      );
      setSelectedGarmentIds((prev) => prev.filter((id) => !idsToAssign.includes(id)));
      setAssigningWorkerId("");
      await loadData();
      onWorkerUpdated?.();
    } catch {
      toast.error("Failed to allocate work to worker");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Mark as Ready: transitions garment to READY and immediately removes from active Ready Queue
  const handleMarkAsReady = async (garment: WorkAllocationItem) => {
    setTogglingGarmentId(garment.garmentId);
    try {
      await markAllocatedGarmentReady(garment.garmentId, true);
      toast.success(
        `✓ Garment #${garment.garmentId} (Order #${garment.orderId}) made by ${
          garment.madeByWorkerName || "worker"
        } marked Ready and removed from active queue!`,
        { icon: "✅", duration: 4000 }
      );
      // Immediately update local state to remove from active queue
      setAllocations((prev) =>
        prev.map((g) =>
          g.garmentId === garment.garmentId ? { ...g, status: "READY" } : g
        )
      );
      onWorkerUpdated?.();
    } catch {
      toast.error("Failed to update garment ready status");
    } finally {
      setTogglingGarmentId(null);
    }
  };

  // Revert back to Stitching if needed
  const handleRevertToStitching = async (garment: WorkAllocationItem) => {
    setTogglingGarmentId(garment.garmentId);
    try {
      await markAllocatedGarmentReady(garment.garmentId, false);
      toast.success(`Garment #${garment.garmentId} returned to Active Stitching queue.`);
      setAllocations((prev) =>
        prev.map((g) =>
          g.garmentId === garment.garmentId ? { ...g, status: "STITCHING" } : g
        )
      );
      onWorkerUpdated?.();
    } catch {
      toast.error("Failed to revert garment status");
    } finally {
      setTogglingGarmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP NAVIGATION SUB-TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-border pb-3 sm:pb-4">
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 -mx-1 px-1 sm:mx-0 sm:px-0">
          <Button
            variant={subTab === "ALLOCATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setSubTab("ALLOCATE")}
            className="gap-1.5 sm:gap-2 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap h-8 sm:h-9"
          >
            <Scissors className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">1. Allocate Cut Garments</span>
            <span className="hidden sm:inline">1. Allocate Cut Garments to Workers</span>
            {pendingAllocationList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-background text-foreground font-extrabold">
                {pendingAllocationList.length}
              </span>
            )}
          </Button>

          <Button
            variant={subTab === "WORKER_LIST" ? "default" : "outline"}
            size="sm"
            onClick={() => setSubTab("WORKER_LIST")}
            className="gap-1.5 sm:gap-2 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap h-8 sm:h-9"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">2. Worker Ready Queue</span>
            <span className="hidden sm:inline">2. Worker Ready Queue (Grouped by Worker)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
              {activeReadyQueueItems.length} active
            </span>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            disabled={loading}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Refresh allocation list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ============================================================
          VIEW 1: ALLOCATE WORK (ONLY CUT GARMENTS CUT BY MASTER)
      ============================================================ */}
      {subTab === "ALLOCATE" && (
        <div className="space-y-4 sm:space-y-5">
          {/* Informational Guidance Notice */}
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-3 sm:p-4 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-3">
            <Scissors className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <p className="font-bold">
                Showing Only Garments Cut by Master (Cutting Done)
              </p>
              <p className="opacity-90 leading-relaxed text-[11px] sm:text-xs">
                Garments only appear in this queue once cutting is marked complete by the Cutting Master in the Cutting Workspace. Uncut fabric garments remain in the Cutting Queue until cut. Assign to a tailor to send them to the Worker Ready Queue.
              </p>
            </div>
          </div>

          {/* Header Action Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search order #, customer, service, book #, master cutter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl bg-background text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>

            {/* Quick Bulk Allocation Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                  {selectedGarmentIds.length} sel.
                </span>
                <select
                  value={assigningWorkerId}
                  onChange={(e) =>
                    setAssigningWorkerId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="rounded-xl border border-border bg-background px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                >
                  <option value="">-- Choose Tailor / Worker --</option>
                  {workers
                    .filter((w) => w.active)
                    .map((w) => {
                      const load = workerActiveLoad.get(w.id) ?? 0;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.workerSpecialty} · {load}/{w.dailyCapacity} pcs)
                        </option>
                      );
                    })}
                </select>
              </div>

              <Button
                size="sm"
                disabled={
                  selectedGarmentIds.length === 0 ||
                  !assigningWorkerId ||
                  submittingAssign
                }
                onClick={() => handleAllocate()}
                className="gap-2 rounded-xl text-xs font-bold w-full sm:w-auto justify-center h-9"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Allot to Worker</span>
              </Button>
            </div>
          </div>

          {/* Pending Garments Table / Cards */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-2xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : pendingAllocationList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                All Cut Garments Have Been Allotted!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No garments cut by the master are currently waiting for worker allotment. When new garments are cut in the <strong>Cutting Workspace</strong>, they will show up here automatically.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/cutting-queue")}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5 text-primary" />
                  <span>Go to Cutting Queue</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  onClick={handleSelectAllPending}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {selectedGarmentIds.length === pendingAllocationList.length ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Select All ({pendingAllocationList.length} cut garments)</span>
                </button>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✂️ Cutting Completed · Ready for Tailor
                </span>
              </div>

              {pendingAllocationList.map((item) => {
                const isSelected = selectedGarmentIds.includes(item.garmentId);

                return (
                  <motion.div
                    key={item.garmentId}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    {/* Left: Checkbox + Order Info + Garment Number */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectGarment(item.garmentId)}
                        className="mt-1 shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${item.orderId}`)}
                            className="font-extrabold text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Order #{item.orderId}
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <Badge variant="outline" className="text-[11px] font-bold">
                            Garment {item.garmentIndexInOrder} of {item.totalGarmentsInOrder}
                          </Badge>

                          {/* Cutting Completed Master Badge */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span>✂️ Cut by Master:</span>
                            <span className="underline decoration-dotted">
                              {item.cuttingByWorkerName || "Cutting Master"}
                            </span>
                          </span>

                          {item.sampleBookPageNumber && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              📖 Book #{item.sampleBookPageNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="font-extrabold text-foreground text-sm">
                            {item.serviceName}
                          </span>
                          <span className="text-muted-foreground">
                            Customer: <strong className="text-foreground">{item.customerName}</strong>
                            {item.customerPhone && ` (${item.customerPhone})`}
                          </span>
                          {item.dueDate && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Due: {item.dueDate}
                            </span>
                          )}
                          {item.tailorCommission && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              Tailor Comm: ₹{item.tailorCommission}
                            </span>
                          )}
                        </div>

                        {/* Add-ons with preview */}
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                              Add-ons:
                            </span>
                            {item.addOns.map((addon) => (
                              <div
                                key={addon.id}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border/70 bg-muted/30 text-[11px]"
                              >
                                {addon.imageUrl && (
                                  <img
                                    src={addon.imageUrl}
                                    alt={addon.name}
                                    className="w-4 h-4 rounded-sm object-cover"
                                  />
                                )}
                                <span className="font-semibold text-foreground">
                                  {addon.name}
                                </span>
                                {addon.quantity > 1 && (
                                  <span className="text-muted-foreground">
                                    x{addon.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Individual Tailor Quick-Assigner */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAllocate(Number(e.target.value), item.garmentId);
                          }
                        }}
                        defaultValue=""
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto cursor-pointer"
                      >
                        <option value="" disabled>
                          Assign Tailor & Move to Ready Queue 🪡
                        </option>
                        {workers
                          .filter((w) => w.active)
                          .map((w) => {
                            const load = workerActiveLoad.get(w.id) ?? 0;
                            return (
                              <option key={w.id} value={w.id}>
                                {w.name} ({load}/{w.dailyCapacity} pcs)
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 2: WORKER READY QUEUE (GROUPED ACCORDING TO WORKER)
      ============================================================ */}
      {subTab === "WORKER_LIST" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Active Queue vs Completed History Sub-toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Button
                variant={readyQueueMode === "ACTIVE" ? "default" : "outline"}
                size="sm"
                onClick={() => setReadyQueueMode("ACTIVE")}
                className="gap-1.5 rounded-xl text-xs font-bold h-8"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Active Ready Queue</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-background text-foreground font-extrabold">
                  {activeReadyQueueItems.length}
                </span>
              </Button>

              <Button
                variant={readyQueueMode === "COMPLETED" ? "default" : "outline"}
                size="sm"
                onClick={() => setReadyQueueMode("COMPLETED")}
                className="gap-1.5 rounded-xl text-xs font-bold h-8"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Completed / Ready ({completedQueueItems.length})</span>
              </Button>
            </div>

            {/* Status explanation pill */}
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {readyQueueMode === "ACTIVE"
                  ? "Garments are grouped by worker. Marking Ready removes them from this queue."
                  : "Review completed garments or revert status if needed."}
              </span>
            </div>
          </div>

          {/* Worker Selector Pills & Filter Toolbar */}
          <div className="flex flex-col gap-3 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1 -mx-1 px-1 lg:mx-0 lg:px-0 lg:flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedWorkerFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    selectedWorkerFilter === "ALL"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  All Workers
                </button>
                {workers
                  .filter((w) => w.active)
                  .map((w) => {
                    const activeCount = allocations.filter(
                      (g) =>
                        g.madeByWorkerId === w.id &&
                        g.status !== "READY" &&
                        g.status !== "DELIVERED"
                    ).length;
                    const active = selectedWorkerFilter === w.id;

                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWorkerFilter(w.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {w.imageUrl ? (
                          <img
                            src={w.imageUrl}
                            alt={w.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-extrabold">
                            {w.name[0]}
                          </span>
                        )}
                        <span>{w.name}</span>
                        <span className="text-[10px] opacity-80">
                          ({activeCount} in progress)
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Stage:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Stages</option>
                  <option value="STITCHING">🪡 In Stitching</option>
                  <option value="IRONING">♨️ In Ironing</option>
                  <option value="READY">✅ Ready for Delivery</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by order #, customer name, garment service, worker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl bg-background text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* ============================================================
              MODE A: ACTIVE READY QUEUE - GROUPED ACCORDING TO WORKER
          ============================================================ */}
          {readyQueueMode === "ACTIVE" && (
            <>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-44 rounded-2xl border border-border bg-card animate-pulse"
                    />
                  ))}
                </div>
              ) : workerGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Active Ready Queue Is Empty!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    All allotted garments have been marked Ready for Delivery, or no active work is currently assigned to the selected workers.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubTab("ALLOCATE")}
                      className="rounded-xl text-xs"
                    >
                      Allocate Cut Garments
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReadyQueueMode("COMPLETED")}
                      className="rounded-xl text-xs"
                    >
                      View Completed Items
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {workerGroups.map((group) => {
                    const isCollapsed = !!collapsedWorkers[group.workerId];

                    return (
                      <div
                        key={group.workerId}
                        className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-xs"
                      >
                        {/* WORKER GROUP HEADER */}
                        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-card to-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {group.workerImage ? (
                              <img
                                src={group.workerImage}
                                alt={group.workerName}
                                className="w-11 h-11 rounded-2xl object-cover border border-border"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                                {group.workerName[0] || "W"}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                                  {group.workerName}
                                </h3>
                                {group.workerSpecialty && (
                                  <Badge variant="outline" className="text-[10px] font-bold">
                                    {group.workerSpecialty}
                                  </Badge>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                                  {group.garments.length} Active {group.garments.length === 1 ? "Piece" : "Pieces"}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {group.workerPhone && (
                                  <a
                                    href={`tel:${group.workerPhone}`}
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-500" />
                                    <span>{group.workerPhone}</span>
                                  </a>
                                )}
                                {group.dailyCapacity && (
                                  <span className="text-[11px]">
                                    Cap: {group.garments.length} / {group.dailyCapacity} pcs/day
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Worker Header Actions */}
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/workers?tab=statement&workerId=${group.workerId}`
                                )
                              }
                              className="rounded-xl text-xs gap-1.5 h-8 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hisab & Slips</span>
                              <span className="sm:hidden">Hisab</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWorkerCollapse(group.workerId)}
                              className="rounded-xl text-xs gap-1 h-8 px-2"
                              title={isCollapsed ? "Expand group" : "Collapse group"}
                            >
                              {isCollapsed ? (
                                <>
                                  <span className="text-xs">Show</span>
                                  <ChevronDown className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  <span className="text-xs">Hide</span>
                                  <ChevronUp className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* WORKER'S GARMENTS ACCORDION CONTENT */}
                        {!isCollapsed && (
                          <div className="p-3 sm:p-4 space-y-3">
                            {group.garments.map((item) => {
                              const isBusy = togglingGarmentId === item.garmentId;

                              return (
                                <motion.div
                                  key={item.garmentId}
                                  layout
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="rounded-xl border border-border bg-card p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs hover:border-border/80 transition-all"
                                >
                                  {/* Garment Details */}
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/orders/${item.orderId}`)}
                                        className="font-extrabold text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        Order #{item.orderId}
                                        <ExternalLink className="w-3 h-3" />
                                      </button>

                                      <Badge variant="outline" className="text-[10px] font-bold">
                                        Garment {item.garmentIndexInOrder} of {item.totalGarmentsInOrder}
                                      </Badge>

                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                          garmentStatusColor[item.status as GarmentStatus] ??
                                          "bg-secondary text-secondary-foreground"
                                        }`}
                                      >
                                        {garmentStatusLabel[item.status as GarmentStatus] || item.status}
                                      </span>

                                      {item.cuttingByWorkerName && (
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                          ✂️ Cut by: {item.cuttingByWorkerName}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                      <span className="font-extrabold text-foreground text-sm">
                                        {item.serviceName}
                                      </span>
                                      <span className="text-muted-foreground">
                                        Customer: <strong className="text-foreground">{item.customerName}</strong>
                                        {item.customerPhone && ` · 📞 ${item.customerPhone}`}
                                      </span>
                                      {item.dueDate && (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                          Due: {item.dueDate}
                                        </span>
                                      )}
                                      {item.sampleBookPageNumber && (
                                        <span className="text-muted-foreground text-[11px]">
                                          Book #{item.sampleBookPageNumber}
                                        </span>
                                      )}
                                      {item.tailorCommission && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                          Commission: ₹{item.tailorCommission}
                                        </span>
                                      )}
                                    </div>

                                    {/* Add-ons preview */}
                                    {item.addOns && item.addOns.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                          Add-ons:
                                        </span>
                                        {item.addOns.map((a) => (
                                          <div
                                            key={a.id}
                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/70 bg-muted/30 text-[10px]"
                                          >
                                            {a.imageUrl && (
                                              <img
                                                src={a.imageUrl}
                                                alt={a.name}
                                                className="w-3.5 h-3.5 rounded-xs object-cover"
                                              />
                                            )}
                                            <span className="font-semibold">{a.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quality Check & "Mark as Ready" Action */}
                                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={isBusy}
                                      onClick={() => handleMarkAsReady(item)}
                                      className="gap-2 rounded-xl text-xs font-bold border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 w-full sm:w-auto justify-center h-8 cursor-pointer transition-all shadow-xs"
                                    >
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      <span>
                                        {isBusy
                                          ? "Marking Ready..."
                                          : "✓ Mark as Ready (Remove from Queue)"}
                                      </span>
                                    </Button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ============================================================
              MODE B: COMPLETED / READY GARMENTS HISTORY
          ============================================================ */}
          {readyQueueMode === "COMPLETED" && (
            <div className="space-y-3">
              {completedQueueItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-xs text-muted-foreground">
                  No completed or ready garments found for the current filter.
                </div>
              ) : (
                completedQueueItems.map((item) => {
                  const isBusy = togglingGarmentId === item.garmentId;

                  return (
                    <motion.div
                      key={item.garmentId}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${item.orderId}`)}
                            className="font-extrabold text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Order #{item.orderId}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            Garment {item.garmentIndexInOrder} of {item.totalGarmentsInOrder}
                          </Badge>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            ✓ Ready for Delivery
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            Made by: <strong>{item.madeByWorkerName}</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{item.serviceName}</span>
                          <span>Customer: {item.customerName}</span>
                          {item.dueDate && <span>Due: {item.dueDate}</span>}
                          {item.tailorCommission && (
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                              Comm: ₹{item.tailorCommission}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleRevertToStitching(item)}
                          className="rounded-xl text-xs gap-1 text-muted-foreground hover:text-amber-600 h-8"
                          title="Revert back to active stitching"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert to Stitching</span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
