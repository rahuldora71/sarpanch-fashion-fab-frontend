import { useMemo, useState } from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";
import type { MeasurementField } from "@/types/measurementField";

interface MeasurementFieldPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFieldIds: number[];
  onSelect: (field: MeasurementField) => void;
}

export function MeasurementFieldPickerDialog({
  open,
  onOpenChange,
  selectedFieldIds,
  onSelect,
}: MeasurementFieldPickerDialogProps) {
  const { fields, loading, error } = useMeasurementFields();
  const [search, setSearch] = useState("");

  const filteredFields = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return fields;
    }
    return fields.filter((f) => f.name.toLowerCase().includes(keyword));
  }, [fields, search]);

  const selectedSet = useMemo(
    () => new Set(selectedFieldIds),
    [selectedFieldIds]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden p-0 sm:max-w-lg">
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
          <DialogTitle>Select Measurement Field</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select a reusable measurement for this service.
          </p>
        </DialogHeader>

        {/* SEARCH */}
        <div className="shrink-0 border-b px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search measurements..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* LIST */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {loading && fields.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading measurements...
            </div>
          )}

          {!loading && error && fields.length === 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && filteredFields.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">No measurement fields found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search.trim()
                  ? `No fields match "${search.trim()}"`
                  : "Create a reusable measurement field from the Services page."}
              </p>
            </div>
          )}

          {filteredFields.map((field) => {
            const selected = selectedSet.has(field.id);

            return (
              <button
                key={field.id}
                type="button"
                disabled={selected}
                onClick={() => {
                  onSelect(field);
                  onOpenChange(false);
                }}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{field.name}</p>
                </div>

                {selected ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Added
                  </span>
                ) : (
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
