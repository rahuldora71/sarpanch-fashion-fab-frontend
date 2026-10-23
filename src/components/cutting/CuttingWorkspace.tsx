import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CuttingWorkspaceGarmentCard from "./CuttingWorkspaceGarmentCard";
import { getCuttingWorkspace, markGarmentAsCut } from "@/services/cuttingService";
import type { CuttingWorkspaceResponse, GarmentResponse } from "@/types/cutting";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

interface Props {
  orderId: number | null;
  open: boolean;
  onClose: () => void;
  onCutComplete: (garmentId: number, updated: GarmentResponse) => void;
}

/**
 * Dedicated cutting workspace sheet.
 * Opens from the Cutting Queue when the cutter taps an order.
 * Shows ALL garments of the order with measurements, add-on instructions,
 * and individual "Mark As Cut" actions.
 */
export default function CuttingWorkspace({ orderId, open, onClose, onCutComplete }: Props) {
  const [workspace, setWorkspace] = useState<CuttingWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGarments, setLoadingGarments] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load workspace when sheet opens
  useEffect(() => {
    if (open && orderId != null) {
      loadWorkspace(orderId);
    }
    if (!open) {
      setWorkspace(null);
      setError(null);
    }
  }, [open, orderId]);

  const loadWorkspace = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCuttingWorkspace(id);
      setWorkspace(data);
    } catch {
      setError("Failed to load cutting workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCut = async (garmentId: number, cuttingNote?: string) => {
    setLoadingGarments((prev) => new Set(prev).add(garmentId));
    try {
      const updated = await markGarmentAsCut(garmentId, { cuttingNote });
      toast.success("Garment marked as cut");

      // Update workspace state locally to reflect new status immediately
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garments: prev.garments.map((g) =>
            g.garmentId === garmentId
              ? { ...g, status: updated.status, pendingCutting: false, cutAt: updated.updatedAt ?? null }
              : g
          ),
        };
      });

      onCutComplete(garmentId, updated);
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

  const pendingCount = workspace?.garments.filter((g) => g.pendingCutting).length ?? 0;
  const totalCount = workspace?.garments.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:w-full sm:data-[side=right]:max-w-xl lg:data-[side=right]:max-w-2xl sm:max-w-xl lg:max-w-2xl p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden"
      >
        {/* HEADER */}
        <SheetHeader className="px-6 py-4 pr-12 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              Cutting Workspace
            </SheetTitle>
            {workspace && (
              <Badge variant="outline" className="text-sm">
                {pendingCount}/{totalCount} pending
              </Badge>
            )}
          </div>

          {/* Customer + order info */}
          {workspace && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mt-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {workspace.customer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{workspace.customer.name}</p>
                <p className="text-xs text-gray-500">{workspace.customer.phone}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">Order #{workspace.orderId}</p>
                {workspace.sampleBookPageNumber && (
                  <p className="text-xs text-gray-500">
                    Sample Book: {workspace.sampleBookPageNumber}
                  </p>
                )}
                {workspace.orderDate && (
                  <p className="text-xs text-gray-400">
                    {format(parseISO(workspace.orderDate), "d MMM yyyy")}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </SheetHeader>

        {/* BODY */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 touch-pan-y"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-sm text-gray-500">Loading workspace...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="py-12 text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                onClick={() => orderId && loadWorkspace(orderId)}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Garments */}
          {!loading && !error && workspace && (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {workspace.garments.map((garment, idx) => (
                  <motion.div
                    key={garment.garmentId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <CuttingWorkspaceGarmentCard
                      garment={garment}
                      onMarkAsCut={handleMarkAsCut}
                      isLoading={loadingGarments.has(garment.garmentId)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER */}
        {workspace && pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t bg-green-50"
          >
            <p className="text-center text-green-700 font-medium text-sm">
              ✓ All garments in this order have been cut
            </p>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}
