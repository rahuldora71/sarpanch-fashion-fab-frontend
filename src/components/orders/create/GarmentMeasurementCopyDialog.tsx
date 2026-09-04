import { Copy, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GarmentCopyOption {
  index: number;
  name: string;
  fieldCount: number;
}

interface GarmentMeasurementCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number;
  garments: GarmentCopyOption[];
  onSelect: (sourceIndex: number) => void;
}

export function GarmentMeasurementCopyDialog({
  open,
  onOpenChange,
  currentIndex,
  garments,
  onSelect,
}: GarmentMeasurementCopyDialogProps) {
  const options = garments.filter(
    (garment) => garment.index !== currentIndex,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Copy from another garment</DialogTitle>
          <DialogDescription>
            Copy measurement values already entered for another garment in
            this order. Only fields configured for the current garment will
            be copied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {options.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Ruler className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />

              <p className="text-sm font-medium">
                No other garment available
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Add another garment and enter its measurements first.
              </p>
            </div>
          ) : (
            options.map((garment) => (
              <div
                key={garment.index}
                className="flex items-center gap-4 rounded-xl border p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/20">
                  <Ruler className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    #{garment.index + 1} {garment.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {garment.fieldCount} measurement values
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(garment.index)}
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
