import { Copy, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { MeasurementFieldsGrid } from "@/components/measurements/MeasurementFieldsGrid";
import { MeasurementSourceDialog } from "@/components/orders/create/MeasurementSourceDialog";

import type {
  MeasurementDraft,
  MeasurementFieldDefinition,
  MeasurementFieldValues,
  MeasurementSourceSummary,
} from "@/types/measurement";

interface MeasurementCardProps {
  garmentNumber: number;
  garmentName: string;
  draft: MeasurementDraft;
  fields: MeasurementFieldDefinition[];
  requiredFieldIds: number[];
  latestMeasurement: MeasurementSourceSummary | null;
  copySources: MeasurementSourceSummary[];
  loadingLatest: boolean;
  loadingSources: boolean;
  sourceDialogOpen: boolean;
  onSourceDialogChange: (open: boolean) => void;
  onOpenSourceDialog: () => void;
  onCopySource: (source: MeasurementSourceSummary) => void;
  onOpenGarmentCopyDialog: () => void;
  onUseLatest: () => void;
  onChangeValues: (values: MeasurementFieldValues) => void;
  onChangeNote: (value: string) => void;
  onChangeAlterationNote: (value: string) => void;
}

export function MeasurementCard({
  garmentNumber,
  garmentName,
  draft,
  fields,
  requiredFieldIds,
  latestMeasurement,
  copySources,
  loadingLatest,
  loadingSources,
  sourceDialogOpen,
  onSourceDialogChange,
  onOpenSourceDialog,
  onCopySource,
  onOpenGarmentCopyDialog,
  onUseLatest,
  onChangeValues,
  onChangeNote,
  onChangeAlterationNote,
}: MeasurementCardProps) {
  return (
    <>
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              #{garmentNumber} {garmentName} Measurements
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Enter the measurements for this garment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {latestMeasurement && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUseLatest}
                disabled={loadingLatest}
              >
                {loadingLatest ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Use latest
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenGarmentCopyDialog}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy from garment
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenSourceDialog}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy from old measurement
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <MeasurementFieldsGrid
            fields={fields}
            values={draft.measurementFields}
            requiredFieldIds={requiredFieldIds}
            onChange={onChangeValues}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`measurement-note-${garmentNumber}`}>
              Measurement Note
            </Label>

            <Textarea
              id={`measurement-note-${garmentNumber}`}
              value={draft.note}
              onChange={(event) => onChangeNote(event.target.value)}
              placeholder="Optional note"
              className="min-h-24 resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`measurement-alteration-${garmentNumber}`}>
              Alteration Note
            </Label>

            <Textarea
              id={`measurement-alteration-${garmentNumber}`}
              value={draft.alterationNote}
              onChange={(event) =>
                onChangeAlterationNote(event.target.value)
              }
              placeholder="Optional alteration note"
              className="min-h-24 resize-y"
            />
          </div>
        </div>
      </section>

      <MeasurementSourceDialog
        open={sourceDialogOpen}
        onOpenChange={onSourceDialogChange}
        sources={copySources}
        loading={loadingSources}
        onSelect={onCopySource}
      />
    </>
  );
}
