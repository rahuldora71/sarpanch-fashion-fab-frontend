import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Scissors,
  CheckCircle2,
  RotateCcw,
  CalendarDays,
  Ruler,
  AlertTriangle,
  FileText,
  Sparkles,
  Shirt,
  ZoomIn,
  Image as ImageIcon,
} from "lucide-react";
import GarmentStatusBadge from "./GarmentStatusBadge";
import { formatDueDate, isDueDateOverdue } from "@/utils/productionUtils";
import type { CuttingWorkspaceGarment, AddOnInfo } from "@/types/cutting";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";

interface Props {
  garment: CuttingWorkspaceGarment;
  onMarkAsCut: (garmentId: number, note?: string) => Promise<void>;
  onRevertCut?: (garmentId: number) => Promise<void>;
  isLoading?: boolean;
  fieldNameMap?: Record<string, string>;
  addOnImageMap?: Record<string, string>;
}

export default function CuttingWorkspaceGarmentCard({
  garment,
  onMarkAsCut,
  onRevertCut,
  isLoading = false,
  fieldNameMap = {},
  addOnImageMap = {},
}: Props) {
  const { t } = useWorkerTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [cuttingNote, setCuttingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewAddOn, setPreviewAddOn] = useState<{
    name: string;
    imageUrl: string;
    instruction?: string | null;
    markingNote?: string | null;
  } | null>(null);

  const isOverdue = isDueDateOverdue(garment.dueDate);
  const canMarkAsCut = garment.pendingCutting && !isLoading && !isSubmitting;
  const canRevertCut =
    !garment.pendingCutting &&
    garment.status === "CUTTING" &&
    Boolean(onRevertCut) &&
    !isLoading &&
    !isSubmitting;

  const resolveFieldName = (rawKey: string): string => {
    const trimmed = rawKey.trim();
    const baseName = fieldNameMap[trimmed] || trimmed;
    return t(baseName);
  };

  const resolveAddOnImage = (addon: AddOnInfo): string | null => {
    if (addon.imageUrl) return addon.imageUrl;
    if (addon.addOnId && addOnImageMap[String(addon.addOnId)]) {
      return addOnImageMap[String(addon.addOnId)];
    }
    const nameKey = `name:${addon.name.trim().toLowerCase()}`;
    if (addOnImageMap[nameKey]) {
      return addOnImageMap[nameKey];
    }
    return null;
  };

  const handleMarkAsCut = async () => {
    setIsSubmitting(true);
    try {
      await onMarkAsCut(garment.garmentId, cuttingNote.trim() || undefined);
      setShowConfirm(false);
      setCuttingNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertCut = async () => {
    if (!onRevertCut) return;
    setIsSubmitting(true);
    try {
      await onRevertCut(garment.garmentId);
      setShowRevertConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const measurementEntries = garment.measurement?.fields
    ? Object.entries(garment.measurement.fields)
    : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`border-l-4 transition-all shadow-sm ${
            !garment.pendingCutting
              ? "border-l-emerald-500 bg-emerald-50/20"
              : isOverdue
              ? "border-l-red-500 bg-red-50/30"
              : "border-l-blue-600 bg-white"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-blue-600 shrink-0" />
                    {garment.serviceName}
                  </CardTitle>

                  <GarmentStatusBadge status={garment.status} />

                  {isOverdue && garment.pendingCutting && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overdue
                    </Badge>
                  )}

                  {garment.sampleNumber && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-50 text-slate-700 border-slate-200"
                    >
                      Sample #{garment.sampleNumber}
                    </Badge>
                  )}

                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      garment.customerFabric
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {garment.customerFabric ? "Customer Fabric" : "Shop Fabric"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 text-sm shrink-0">
                <div
                  className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md text-xs ${
                    isOverdue && garment.pendingCutting
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Due: {formatDueDate(garment.dueDate)}</span>
                </div>

                {garment.tryDate && (
                  <div className="text-xs text-gray-500">
                    Try Date: {formatDueDate(garment.tryDate)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* MEASUREMENTS */}
            <div className="space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                Measurements
              </h4>

              {measurementEntries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {measurementEntries.map(([key, value]) => {
                    const fieldName = resolveFieldName(key);
                    return (
                      <div
                        key={key}
                        className="bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2.5 flex flex-col justify-between"
                      >
                        <span className="text-xs font-medium text-gray-600 capitalize truncate">
                          {fieldName}
                        </span>
                        <span className="text-lg font-bold text-gray-900 mt-0.5">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-3 border border-dashed">
                  No measurements recorded for this garment.
                </div>
              )}

              {garment.measurement?.note && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <span className="font-semibold">Measurement Note:</span>{" "}
                  {garment.measurement.note}
                </div>
              )}
            </div>

            {/* CUTTING ADD-ONS (CUTTING INSTRUCTIONS + IMAGE) */}
            {garment.cuttingAddOns.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Before-Cutting Requirements ({garment.cuttingAddOns.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {garment.cuttingAddOns.map((addon) => {
                    const imageUrl = resolveAddOnImage(addon);
                    return (
                      <div
                        key={addon.garmentAddOnId}
                        className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 flex gap-3.5 items-start"
                      >
                        {/* Add-On Reference Image */}
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewAddOn({
                                name: addon.name,
                                imageUrl,
                                instruction: addon.cuttingInstruction,
                                markingNote: addon.fabricMarkingNote,
                              })
                            }
                            className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border-2 border-red-200 bg-white shrink-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                            title="Click to enlarge add-on photo"
                          >
                            <img
                              src={imageUrl}
                              alt={addon.name}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-20 h-20 rounded-lg border border-red-200 bg-white/70 flex flex-col items-center justify-center text-red-300 shrink-0">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] text-red-400 mt-1">
                              No Photo
                            </span>
                          </div>
                        )}

                        {/* Add-On Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-red-900">
                              {addon.name}
                            </span>
                            {addon.quantity > 1 && (
                              <Badge
                                variant="outline"
                                className="bg-white text-red-700 border-red-300 text-xs shrink-0"
                              >
                                Qty: {addon.quantity}
                              </Badge>
                            )}
                          </div>

                          {addon.cuttingInstruction && (
                            <p className="text-sm text-red-800 leading-relaxed">
                              {addon.cuttingInstruction}
                            </p>
                          )}

                          {addon.fabricMarkingNote && (
                            <div className="text-xs bg-white border border-red-200 rounded-md p-2.5 text-red-900">
                              <span className="font-semibold block text-red-700 mb-0.5">
                                Chalk / Fabric Marking:
                              </span>
                              {addon.fabricMarkingNote}
                            </div>
                          )}

                          {addon.note && (
                            <p className="text-xs text-red-700 italic">
                              Note: {addon.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OTHER ADD-ONS (STITCHING / POST-CUTTING + IMAGE) */}
            {garment.otherAddOns.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                  Stitching / Post-Cutting Add-ons ({garment.otherAddOns.length})
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {garment.otherAddOns.map((addon) => {
                    const imageUrl = resolveAddOnImage(addon);
                    return (
                      <div
                        key={addon.garmentAddOnId}
                        className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-3"
                      >
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewAddOn({
                                name: addon.name,
                                imageUrl,
                                instruction: addon.cuttingInstruction,
                              })
                            }
                            className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 bg-white shrink-0 group"
                            title="Click to enlarge add-on photo"
                          >
                            <img
                              src={imageUrl}
                              alt={addon.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-gray-800">
                            {addon.name}
                            {addon.quantity > 1 ? ` (×${addon.quantity})` : ""}
                          </p>
                          {addon.note && (
                            <p className="text-gray-500 italic">{addon.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NOTES */}
            {garment.note && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  Garment Notes
                </h4>
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200/80 rounded-lg p-3">
                  {garment.note}
                </p>
              </div>
            )}

            <Separator />

            {/* ACTION FOOTER */}
            {garment.pendingCutting ? (
              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Verify measurements and before-cutting add-on instructions before cutting.
                </p>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!canMarkAsCut}
                  className="w-full sm:w-auto sm:min-w-[200px] h-10 font-semibold gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Scissors className="w-4 h-4" />
                  {isSubmitting ? "Marking as cut..." : "Mark As Cut"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Cut completed
                    {garment.cuttingByUserName
                      ? ` by ${garment.cuttingByUserName}`
                      : ""}
                  </span>
                </div>

                {canRevertCut && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevertConfirm(true)}
                    disabled={isSubmitting}
                    className="gap-1.5 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Revert Cut
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ADD-ON IMAGE LIGHTBOX PREVIEW DIALOG */}
      <Dialog
        open={Boolean(previewAddOn)}
        onOpenChange={(open) => {
          if (!open) setPreviewAddOn(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewAddOn?.name}</DialogTitle>
          </DialogHeader>
          {previewAddOn && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center max-h-80">
                <img
                  src={previewAddOn.imageUrl}
                  alt={previewAddOn.name}
                  className="max-h-80 w-auto object-contain"
                />
              </div>
              {previewAddOn.instruction && (
                <p className="text-sm text-gray-700">
                  <strong>Cutting Instruction:</strong> {previewAddOn.instruction}
                </p>
              )}
              {previewAddOn.markingNote && (
                <p className="text-xs bg-red-50 text-red-800 border border-red-200 rounded-md p-2.5">
                  <strong>Chalk / Fabric Marking:</strong> {previewAddOn.markingNote}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MARK AS CUT CONFIRMATION DIALOG */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark garment as cut?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that cutting and pattern preparation for this garment is complete.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Garment:</span>
                <span className="font-semibold text-gray-900">
                  {garment.serviceName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Due Date:</span>
                <span
                  className={`font-medium ${
                    isOverdue ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatDueDate(garment.dueDate)}
                </span>
              </div>
              {garment.cuttingAddOns.length > 0 && (
                <div className="text-sm pt-1 border-t">
                  <span className="text-gray-600 block mb-1.5 font-medium">
                    Cutting Requirements Confirmed:
                  </span>
                  <div className="space-y-1.5">
                    {garment.cuttingAddOns.map((addon) => {
                      const imgUrl = resolveAddOnImage(addon);
                      return (
                        <div
                          key={addon.garmentAddOnId}
                          className="flex items-center gap-2 text-xs text-red-800 bg-red-50/70 p-1.5 rounded border border-red-200"
                        >
                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt={addon.name}
                              className="w-8 h-8 rounded object-cover border border-red-200 shrink-0"
                            />
                          )}
                          <span className="font-medium">{addon.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Cutting / Fabric Marking Notes (optional)
              </label>
              <textarea
                value={cuttingNote}
                onChange={(e) => setCuttingNote(e.target.value)}
                placeholder="E.g., pattern adjusted, chalk markings completed..."
                className="w-full text-sm text-gray-900 border rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsCut}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Confirm & Mark Cut"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* REVERT CUT CONFIRMATION DIALOG */}
      <AlertDialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert cut status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>{garment.serviceName}</strong> back to{" "}
              <strong>Pending Cutting (FABRIC_CUT)</strong> status in the queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertCut}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? "Reverting..." : "Revert to Pending Cut"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
