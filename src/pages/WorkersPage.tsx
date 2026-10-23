import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  UsersRound,
  UserPlus,
  Search,
  Phone,
  Gauge,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Minus,
  Plus,
  MapPin,
  Sparkles,
  Power,
  Scissors,
  Receipt,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import {
  getAllWorkers,
  updateWorkerCapacity,
  updateWorkerStatus,
  deleteWorker,
} from "@/services/workerService";
import { recordAttendance } from "@/services/productionCalendarService";
import {
  WORKER_SPECIALTIES,
  type Worker,
} from "@/types/worker";
import type { AttendanceStatus } from "@/types/productionCalendar";
import { WorkerDialog } from "@/components/workers/WorkerDialog";
import { WorkAllocationTab } from "@/components/workers/WorkAllocationTab";
import { WorkerStatementTab } from "@/components/workers/WorkerStatementTab";
import { WorkerProductionHistoryTab } from "@/components/workers/WorkerProductionHistoryTab";

const ATTENDANCE_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  pct: number;
  activeClass: string;
}[] = [
  {
    status: "PRESENT",
    label: "✓ Present (100%)",
    pct: 100,
    activeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  },
  {
    status: "HALF_DAY",
    label: "◐ Half Day (50%)",
    pct: 50,
    activeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  },
  {
    status: "ABSENT",
    label: "✗ Absent (0%)",
    pct: 0,
    activeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
  },
  {
    status: "LEAVE",
    label: "🏖 Leave (0%)",
    pct: 0,
    activeClass:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40",
  },
];

export default function WorkersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isProductionRoute =
    location.pathname.includes("worker-production") ||
    location.pathname.includes("production-history");
  const initialTab =
    isProductionRoute || tabParam === "history" || tabParam === "production"
      ? "HISTORY"
      : tabParam === "directory"
      ? "DIRECTORY"
      : tabParam === "statement" || tabParam === "hisab"
      ? "STATEMENT"
      : "ALLOCATION";
  const [activeTab, setActiveTab] = useState<
    "ALLOCATION" | "DIRECTORY" | "STATEMENT" | "HISTORY"
  >(initialTab);
  const selectedWorkerFromUrl = searchParams.get("workerId")
    ? Number(searchParams.get("workerId"))
    : undefined;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [busyWorkerId, setBusyWorkerId] = useState<number | null>(null);

  const loadWorkers = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await getAllWorkers(kw);
      setWorkers(data);
    } catch (err) {
      console.error("Failed to load workers:", err);
      toast.error("Could not load workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWorkers(search);
    }, 220);
    return () => clearTimeout(timer);
  }, [search, loadWorkers]);

  const filteredWorkers = useMemo(() => {
    if (specialtyFilter === "ALL") return workers;
    return workers.filter((w) => w.workerSpecialty === specialtyFilter);
  }, [workers, specialtyFilter]);

  // Aggregate KPI metrics
  const kpis = useMemo(() => {
    const activeList = workers.filter((w) => w.active);
    const totalDailyCap = activeList.reduce(
      (sum, w) => sum + Number(w.dailyCapacity ?? 0),
      0
    );
    const effectiveTodayCap = activeList.reduce((sum, w) => {
      const cap = Number(w.dailyCapacity ?? 0);
      const pct = w.todayCapacityPercentage ?? 100;
      return sum + (cap * pct) / 100;
    }, 0);
    const presentCount = activeList.filter(
      (w) => (w.todayAttendanceStatus ?? "PRESENT") === "PRESENT"
    ).length;

    return {
      totalWorkers: workers.length,
      activeWorkers: activeList.length,
      totalDailyCap: Math.round(totalDailyCap * 10) / 10,
      effectiveTodayCap: Math.round(effectiveTodayCap * 10) / 10,
      presentCount,
    };
  }, [workers]);

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setDialogOpen(true);
  };

  const handleQuickCapacityDelta = async (worker: Worker, delta: number) => {
    const nextCap = Math.max(0, Number(worker.dailyCapacity ?? 0) + delta);
    setBusyWorkerId(worker.id);
    try {
      const updated = await updateWorkerCapacity(worker.id, nextCap);
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? updated : w))
      );
      toast.success(`${worker.name}'s capacity set to ${nextCap} pcs/day`);
    } catch {
      toast.error("Failed to update capacity");
    } finally {
      setBusyWorkerId(null);
    }
  };

  const handleToggleActive = async (worker: Worker, nextActive: boolean) => {
    setBusyWorkerId(worker.id);
    try {
      const updated = await updateWorkerStatus(worker.id, nextActive);
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? updated : w))
      );
      toast.success(
        nextActive
          ? `${worker.name} enabled in workshop`
          : `${worker.name} marked inactive`
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusyWorkerId(null);
    }
  };

  const handleAttendanceChange = async (
    worker: Worker,
    status: AttendanceStatus,
    pct: number
  ) => {
    setBusyWorkerId(worker.id);
    try {
      const todayIso = format(new Date(), "yyyy-MM-dd");
      await recordAttendance({
        workerId: worker.id,
        date: todayIso,
        status,
        capacityPercentage: pct,
      });
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === worker.id
            ? {
                ...w,
                todayAttendanceStatus: status,
                todayCapacityPercentage: pct,
              }
            : w
        )
      );
      toast.success(`Updated today's attendance for ${worker.name}`);
    } catch {
      toast.error("Failed to update attendance");
    } finally {
      setBusyWorkerId(null);
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    if (!window.confirm(`Remove worker "${worker.name}"?`)) return;
    setBusyWorkerId(worker.id);
    try {
      await deleteWorker(worker.id);
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
      toast.success(`Removed worker "${worker.name}"`);
    } catch {
      toast.error("Could not delete worker");
    } finally {
      setBusyWorkerId(null);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground pb-12">
      {/* PAGE HEADER */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xs px-3 sm:px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                Workers & Capacity Portal
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                Manage tailors, cutting masters, capacity, and accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/production")}
              className="gap-1.5 sm:gap-2 rounded-xl text-xs h-8 sm:h-9"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span>Calendar</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="gap-1.5 sm:gap-2 rounded-xl text-xs h-8 sm:h-9 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Add Worker</span>
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-3.5 sm:pt-4 space-y-4">
        {/* TOP LEVEL TABS - Smooth Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 border-b border-border pb-2.5 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALLOCATION");
              setSearchParams({ tab: "allocation" });
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "ALLOCATION"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Scissors className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">🧵 Allocation</span>
            <span className="hidden sm:inline">🧵 Work Allocation & Ready Check</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("DIRECTORY");
              setSearchParams({ tab: "directory" });
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "DIRECTORY"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <UsersRound className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">👷 Directory</span>
            <span className="hidden sm:inline">👷 Workers Directory & Capacity</span>
            <Badge variant="secondary" className="ml-1 text-[10px] sm:text-[11px] font-bold px-1.5 py-0">
              {workers.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("HISTORY");
              setSearchParams({ tab: "history" });
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "HISTORY"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">📊 Who Made What</span>
            <span className="hidden sm:inline">📊 Production History (किसने क्या सिला)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("STATEMENT");
              setSearchParams({ tab: "statement" });
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "STATEMENT"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">💰 Hisab & Slips</span>
            <span className="hidden sm:inline">💰 Statements & Hisab (कारीगर हिसाब व पर्ची)</span>
          </button>
        </div>

        {/* TAB 1: WORK ALLOCATION */}
        {activeTab === "ALLOCATION" && (
          <WorkAllocationTab
            workers={workers}
            onWorkerUpdated={() => loadWorkers(search)}
          />
        )}

        {/* TAB 2: WORKERS DIRECTORY & CAPACITY */}
        {activeTab === "DIRECTORY" && (
          <div className="space-y-4">
            {/* TOP KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UsersRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">Active Workers</p>
              <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {kpis.activeWorkers}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {kpis.totalWorkers}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80 truncate">
                Max Daily Cap
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
                {kpis.totalDailyCap}{" "}
                <span className="text-xs font-semibold">pcs/d</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 truncate">
                Today's Effective
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                {kpis.effectiveTodayCap}{" "}
                <span className="text-xs font-semibold">pcs</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 p-3 sm:p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 truncate">
                Present Today
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300">
                {kpis.presentCount}{" "}
                <span className="text-xs font-semibold">
                  / {kpis.activeWorkers}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH & SPECIALTY FILTERS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search worker by name, phone, specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-background text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>

          <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1 md:pb-0 md:flex-wrap -mx-1 px-1 md:mx-0 md:px-0">
            <button
              type="button"
              onClick={() => setSpecialtyFilter("ALL")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                specialtyFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              All ({workers.length})
            </button>
            {WORKER_SPECIALTIES.map((spec) => {
              const count = workers.filter(
                (w) => w.workerSpecialty === spec.value
              ).length;
              const active = specialtyFilter === spec.value;
              return (
                <button
                  key={spec.value}
                  type="button"
                  onClick={() => setSpecialtyFilter(spec.value)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {spec.icon} {spec.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKERS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 rounded-2xl border border-border bg-card animate-pulse p-5"
              />
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <UsersRound className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              No Workers Found
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Add your tailors, cutting masters, and ironing staff with their photo, phone number, and daily garment capacity.
            </p>
            <Button onClick={handleOpenAdd} className="gap-2 rounded-xl mt-2">
              <UserPlus className="w-4 h-4" />
              Add First Worker
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => {
              const specMeta =
                WORKER_SPECIALTIES.find(
                  (s) => s.value === worker.workerSpecialty
                ) ?? WORKER_SPECIALTIES[0];
              const initials = worker.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isBusy = busyWorkerId === worker.id;
              const currentAtt = worker.todayAttendanceStatus ?? "PRESENT";

              return (
                <motion.div
                  key={worker.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border bg-card text-card-foreground p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between gap-4 ${
                    worker.active
                      ? "border-border hover:shadow-md"
                      : "border-border/60 opacity-65"
                  }`}
                >
                  {/* Top Profile Row: Photo + Name + Specialty + Actions */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      {/* Worker Photo or Initials Avatar */}
                      <div className="relative shrink-0">
                        {worker.imageUrl ? (
                          <img
                            src={worker.imageUrl}
                            alt={worker.name}
                            className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-primary/30 shadow-sm"
                          />
                        ) : (
                          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-primary/25 text-primary font-extrabold text-base sm:text-lg flex items-center justify-center">
                            {initials}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-card ${
                            worker.active ? "bg-emerald-500" : "bg-muted-foreground"
                          }`}
                          title={worker.active ? "Active" : "Inactive"}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-foreground truncate">
                          {worker.name}
                        </h3>

                        <Badge
                          variant="outline"
                          className={`mt-1 text-[11px] font-semibold ${specMeta.badgeClass}`}
                        >
                          {specMeta.icon} {specMeta.label}
                        </Badge>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <a
                            href={`tel:${worker.phone}`}
                            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="w-3 h-3 text-primary" />
                            {worker.phone}
                          </a>
                          {worker.city && (
                            <span className="inline-flex items-center gap-0.5 text-[11px]">
                              <MapPin className="w-3 h-3" />
                              {worker.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit / Delete / Statement Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-[11px] font-bold gap-1 px-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                        onClick={() => {
                          setActiveTab("STATEMENT");
                          setSearchParams({ tab: "statement", workerId: worker.id.toString() });
                        }}
                        title="View Hisab & Statement for this worker"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>हिसाब</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleOpenEdit(worker)}
                        title="Edit worker"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => handleDeleteWorker(worker)}
                        title="Delete worker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Middle: Daily Capacity Quick Adjuster */}
                  <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/15 p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-primary" />
                        Daily Capacity
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Effective today:{" "}
                        <strong>
                          {Math.round(
                            ((worker.dailyCapacity ?? 0) *
                              (worker.todayCapacityPercentage ?? 100)) /
                              10
                          ) / 10}{" "}
                          pcs
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isBusy || worker.dailyCapacity <= 0}
                        onClick={() => handleQuickCapacityDelta(worker, -1)}
                        className="h-7 w-7 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>

                      <div className="min-w-[68px] text-center px-2 py-1 rounded-lg bg-background border border-border">
                        <span className="text-sm font-extrabold text-primary">
                          {worker.dailyCapacity}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                          pcs/d
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isBusy}
                        onClick={() => handleQuickCapacityDelta(worker, 1)}
                        className="h-7 w-7 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Today's Attendance Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-muted-foreground">
                        Today's Floor Attendance
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Power className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Active</span>
                        <Switch
                          checked={worker.active}
                          disabled={isBusy}
                          onCheckedChange={(checked) =>
                            handleToggleActive(worker, checked)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {ATTENDANCE_OPTIONS.map((opt) => {
                        const isSelected = currentAtt === opt.status;
                        return (
                          <button
                            key={opt.status}
                            type="button"
                            disabled={isBusy || !worker.active}
                            onClick={() =>
                              handleAttendanceChange(
                                worker,
                                opt.status,
                                opt.pct
                              )
                            }
                            className={`px-1.5 sm:px-2 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all cursor-pointer truncate text-center ${
                              isSelected
                                ? opt.activeClass
                                : "bg-background text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
          </div>
        )}

        {/* TAB 3: WORKER PRODUCTION HISTORY ("WHO MADE WHAT") */}
        {activeTab === "HISTORY" && (
          <WorkerProductionHistoryTab workers={workers} />
        )}

        {/* TAB 4: WORKER STATEMENT & HISAB */}
        {activeTab === "STATEMENT" && (
          <WorkerStatementTab
            workers={workers}
            initialWorkerId={selectedWorkerFromUrl}
          />
        )}
      </div>

      {/* ADD / EDIT WORKER MODAL */}
      <WorkerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingWorker={editingWorker}
        onSaved={() => loadWorkers(search)}
      />
    </div>
  );
}
