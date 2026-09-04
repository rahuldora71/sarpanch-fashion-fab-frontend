import {
  Check,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SelectedOrderAddOn } from "@/types/order";

interface SelectedItemsPanelProps {
  addOns: SelectedOrderAddOn[];
  selectedAddOnIds: number[];
  loading?: boolean;
  onToggle: (addOn: SelectedOrderAddOn) => void;
}

export function SelectedItemsPanel({
  addOns,
  selectedAddOnIds,
  loading = false,
  onToggle,
}: SelectedItemsPanelProps) {
  return (
    <aside className="h-fit overflow-hidden rounded-xl border bg-card xl:sticky xl:top-5">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b bg-orange-50 px-5 py-4 dark:bg-orange-950/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">
              Add-ons
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Select add-ons for this garment
            </p>
          </div>

          <div className="flex h-10 min-w-10 items-center justify-center rounded-md border-2 border-orange-500 bg-background px-2 text-sm font-bold text-orange-600">
            {selectedAddOnIds.length}
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="space-y-3 p-4">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching add-ons...
          </div>
        ) : addOns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ImageIcon className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />

            <p className="text-sm font-medium">
              No add-ons found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try searching for another add-on.
            </p>
          </div>
        ) : (
          addOns.map((addOn) => {
            const selected =
              selectedAddOnIds.includes(addOn.id);

            return (
              <div
                key={addOn.id}
                role="button"
                tabIndex={0}
                onClick={() => onToggle(addOn)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    onToggle(addOn);
                  }
                }}
                className={[
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                  selected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "bg-background hover:bg-accent",
                ].join(" ")}
              >
                {/* =================================================
                    IMAGE
                ================================================= */}

                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {addOn.imageUrl ? (
                    <img
                      src={addOn.imageUrl}
                      alt={addOn.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* =================================================
                    DETAILS
                ================================================= */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {addOn.name}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ₹
                    {Number(
                      addOn.price ?? 0,
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* =================================================
                    SELECT INDICATOR
                ================================================= */}

                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
                    selected
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "bg-background",
                  ].join(" ")}
                >
                  {selected && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* =====================================================
            DONE
        ===================================================== */}

        <Button
          type="button"
          variant="outline"
          className="w-full"
        >
          Done
        </Button>
      </div>
    </aside>
  );
}