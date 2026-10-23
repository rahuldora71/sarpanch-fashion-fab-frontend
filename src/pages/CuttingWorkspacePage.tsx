import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Scissors,
  RefreshCw,
  CheckCircle2,
  Phone,
  BookOpen,
  CalendarDays,
  ExternalLink,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CuttingWorkspaceGarmentCard from "@/components/cutting/CuttingWorkspaceGarmentCard";
import {
  getCuttingWorkspace,
  markGarmentAsCut,
  revertGarmentCut,
} from "@/services/cuttingService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import { getAddOns } from "@/services/addOnService";
import type { CuttingWorkspaceResponse } from "@/types/cutting";

type GarmentFilterTab = "all" | "pending" | "completed";

export default function CuttingWorkspacePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const numericOrderId = orderId ? Number(orderId) : null;

  const [workspace, setWorkspace] = useState<CuttingWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGarments, setLoadingGarments] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<GarmentFilterTab>("all");
  const { fieldNameMap } = useMeasurementFields();
  const [addOnImageMap, setAddOnImageMap] = useState<Record<string, string>>({});

  useEffect(() => {

    getAddOns(0, 500)
      .then((res) => {
        const map: Record<string, string> = {};
        res.content.forEach((addon) => {
          if (addon.imageUrl) {
            map[String(addon.id)] = addon.imageUrl;
            map[`name:${addon.name.trim().toLowerCase()}`] = addon.imageUrl;
          }
        });
        setAddOnImageMap(map);
      })
      .catch(() => {});
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!numericOrderId || Number.isNaN(numericOrderId)) {
      setError("Invalid order ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCuttingWorkspace(numericOrderId);
      setWorkspace(data);
    } catch {
      setError("Failed to load cutting workspace for this order. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [numericOrderId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleMarkAsCut = async (garmentId: number, cuttingNote?: string) => {
    setLoadingGarments((prev) => new Set(prev).add(garmentId));
    try {
      const updated = await markGarmentAsCut(garmentId, { cuttingNote });
      toast.success("Garment marked as cut");

      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garments: prev.garments.map((g) =>
            g.garmentId === garmentId
              ? {
                  ...g,
                  status: updated.status,
                  pendingCutting: false,
                  cuttingByUserId: updated.cuttingById ?? g.cuttingByUserId,
                  cutAt: updated.updatedAt ?? new Date().toISOString(),
                }
              : g
          ),
        };
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to mark garment as cut";
      toast.error(msg);
    } finally {
      setLoadingGarments((prev) => {
        const next = new Set(prev);
        next.delete(garmentId);
        return next;
      });
    }
  };

  const handleRevertCut = async (garmentId: number) => {
    setLoadingGarments((prev) => new Set(prev).add(garmentId));
    try {
      const updated = await revertGarmentCut(garmentId);
      toast.success("Garment reverted to Pending Cutting");

      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garments: prev.garments.map((g) =>
            g.garmentId === garmentId
              ? {
                  ...g,
                  status: updated.status,
                  pendingCutting: true,
                  cuttingByUserName: null,
                  cutAt: null,
                }
              : g
          ),
        };
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to revert cut status";
      toast.error(msg);
    } finally {
      setLoadingGarments((prev) => {
        const next = new Set(prev);
        next.delete(garmentId);
        return next;
      });
    }
  };

  const totalCount = workspace?.garments.length ?? 0;
  const pendingCount =
    workspace?.garments.filter((g) => g.pendingCutting).length ?? 0;
  const completedCount = totalCount - pendingCount;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredGarments =
    workspace?.garments.filter((g) => {
      if (filterTab === "pending") return g.pendingCutting;
      if (filterTab === "completed") return !g.pendingCutting;
      return true;
    }) ?? [];

  return (
    <div className="min-h-full bg-gray-50/50 pb-12">
      {/* TOP PAGE HEADER */}
      <div className="bg-white border-b px-4 md:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/cutting-queue")}
              className="gap-1.5 text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </Button>

            <div className="h-5 w-px bg-gray-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">
                    Cutting Workspace
                  </h1>
                  {numericOrderId && (
                    <Badge variant="secondary" className="font-semibold">
                      Order #{numericOrderId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/workers?tab=allocation")}
              className="gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Scissors className="w-3.5 h-3.5" />
              Work Allocation
            </Button>
            {numericOrderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/orders/${numericOrderId}`)}
                className="gap-1.5 text-gray-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Order Details
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadWorkspace}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* LOADING STATE */}
        {loading && !workspace && (
          <div className="space-y-4">
            <div className="h-32 rounded-xl bg-white border animate-pulse" />
            <div className="h-64 rounded-xl bg-white border animate-pulse" />
            <div className="h-64 rounded-xl bg-white border animate-pulse" />
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <Card className="border-red-200 bg-white">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-red-600 font-medium">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/cutting-queue")}
                >
                  Back to Queue
                </Button>
                <Button onClick={loadWorkspace}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* WORKSPACE CONTENT */}
        {!error && workspace && (
          <>
            {/* CUSTOMER & ORDER PROGRESS SUMMARY CARD */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Customer Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-blue-100 shrink-0">
                      {workspace.customer.image && (
                        <AvatarImage
                          src={workspace.customer.image}
                          alt={workspace.customer.name}
                        />
                      )}
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                        {workspace.customer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {workspace.customer.name}
                        </h2>
                        {workspace.customer.customerCode && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-slate-50 text-slate-700"
                          >
                            {workspace.customer.customerCode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {workspace.customer.phone}
                        </span>

                        {workspace.sampleBookPageNumber && (
                          <span className="flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            <BookOpen className="w-3.5 h-3.5" />
                            Sample Book: {workspace.sampleBookPageNumber}
                          </span>
                        )}

                        {workspace.orderDate && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                            Ordered:{" "}
                            {format(parseISO(workspace.orderDate), "d MMM yyyy")}
                          </span>
                        )}

                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600"
                          onClick={() =>
                            navigate(`/customers/${workspace.customer.customerId}`)
                          }
                        >
                          <UserRound className="w-3 h-3 mr-1" />
                          View Customer Profile
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cutting Progress Summary */}
                  <div className="lg:w-72 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700">
                        Cutting Progress
                      </span>
                      <span className="font-bold text-blue-700">
                        {completedCount} / {totalCount} Cut ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span>{pendingCount} pending cutting</span>
                      <span>{completedCount} completed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ALL GARMENTS CUT BANNER */}
            {totalCount > 0 && pendingCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">
                      All garments in Order #{workspace.orderId} have been cut!
                    </h3>
                    <p className="text-sm text-emerald-700">
                      All {totalCount} garment{totalCount !== 1 ? "s" : ""} are
                      ready to proceed to stitching.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/cutting-queue")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  Return to Cutting Queue
                </Button>
              </motion.div>
            )}

            {/* FILTER TABS */}
            <div className="flex items-center justify-between">
              <Tabs
                value={filterTab}
                onValueChange={(v) => setFilterTab(v as GarmentFilterTab)}
              >
                <TabsList>
                  <TabsTrigger value="all">
                    All Garments
                    <Badge variant="secondary" className="ml-1.5 text-xs">
                      {totalCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending Cutting
                    {pendingCount > 0 && (
                      <Badge className="ml-1.5 text-xs bg-amber-600">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Cut Completed
                    {completedCount > 0 && (
                      <Badge className="ml-1.5 text-xs bg-emerald-600">
                        {completedCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* GARMENTS LIST */}
            {filteredGarments.length === 0 ? (
              <Card className="bg-white border-dashed">
                <CardContent className="py-14 text-center text-gray-500">
                  No garments match the selected filter.
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {filteredGarments.map((garment) => (
                    <CuttingWorkspaceGarmentCard
                      key={garment.garmentId}
                      garment={garment}
                      onMarkAsCut={handleMarkAsCut}
                      onRevertCut={handleRevertCut}
                      isLoading={loadingGarments.has(garment.garmentId)}
                      fieldNameMap={fieldNameMap}
                      addOnImageMap={addOnImageMap}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}
