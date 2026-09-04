import { Copy, Loader2, Ruler } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { MeasurementSourceSummary } from "@/types/measurement";

interface MeasurementSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: MeasurementSourceSummary[];
  loading?: boolean;
  onSelect: (source: MeasurementSourceSummary) => void;
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MeasurementSourceDialog({
  open,
  onOpenChange,
  sources,
  loading = false,
  onSelect,
}: MeasurementSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Copy from old measurement</DialogTitle>
          <DialogDescription>
            Select a previous measurement for this customer. The values will
            be copied into the current garment and can still be edited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading previous measurements...
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Ruler className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">
                No previous measurements found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                There are no other measurements available to copy.
              </p>
            </div>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-accent"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/20">
                  <Ruler className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {source.serviceName || `Service #${source.serviceId}`}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {Object.keys(source.measurementFields ?? {}).length} fields
                    {" · "}
                    {formatDate(source.createdAt ?? source.updatedAt)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(source)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
