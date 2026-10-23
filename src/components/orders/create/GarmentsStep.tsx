/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GarmentForm } from "@/components/orders/create/GarmentForm";
import { SelectedItemsPanel } from "@/components/orders/create/SelectedItemsPanel";

import type {
  GarmentFormValue,
  SelectedOrderAddOn,
} from "@/types/order";
import { generateUUID } from "@/utils/uuid";

export type OrderGarment = GarmentFormValue & {
  localId: string;
  individualDueDateEnabled: boolean;
  dueDate: string;
};

export interface GarmentsStepProps {
  garments: OrderGarment[];
  commonDueDate: string;
  sampleBookPageNumber: string;
  onChange: (garments: OrderGarment[]) => void;
  onCommonDueDateChange: (value: string) => void;
  onSampleBookPageNumberChange: (value: string) => void;
}

export function createEmptyGarment(sequence = 1): OrderGarment {
  return {
    localId: generateUUID(),

    serviceId: null,
    serviceName: "",
    price: 0,

    sampleNumber: String(sequence),
    notes: "",

    addOns: [],

    individualDueDateEnabled: false,
    dueDate: "",
  };
}

export function GarmentsStep({
  garments,
  commonDueDate,
  sampleBookPageNumber,
  onChange,
  onCommonDueDateChange,
  onSampleBookPageNumberChange,
}: GarmentsStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeGarment = garments[activeIndex] ?? garments[0];

  const updateGarment = (
    index: number,
    updates: Partial<OrderGarment>,
  ) => {
    if (garments[index]?.isLocked) {
      return;
    }

    onChange(
      garments.map((garment, garmentIndex) =>
        garmentIndex === index
          ? {
              ...garment,
              ...updates,
            }
          : garment,
      ),
    );
  };

  const addGarment = () => {
    onChange([
      ...garments,
      createEmptyGarment(garments.length + 1),
    ]);

    setActiveIndex(garments.length);
  };

  const removeGarment = (index: number) => {
    if (garments.length <= 1) {
      return;
    }

    if (garments[index]?.isLocked) {
      return;
    }

    const next = garments.filter(
      (_, i) => i !== index,
    );

    onChange(next);

    if (activeIndex > index) {
      setActiveIndex(
        (value) => value - 1,
      );
    } else if (
      activeIndex >= next.length
    ) {
      setActiveIndex(
        next.length - 1,
      );
    }
  };

  const handleAddAddOn = (addOn: SelectedOrderAddOn) => {
    if (!activeGarment || activeGarment.isLocked) {
      return;
    }

    if (activeGarment.addOns.some((item) => item.id === addOn.id)) {
      return;
    }

    updateGarment(activeIndex, {
      addOns: [
        ...activeGarment.addOns,
        {
          ...addOn,
          beforeCutting: Boolean(addOn.beforeCutting),
          quantity: 1,
          totalPrice: Number(addOn.price ?? 0),
        },
      ],
    });
  };

  const handleRemoveAddOn = (addOnId: number) => {
    if (!activeGarment || activeGarment.isLocked) {
      return;
    }

    updateGarment(activeIndex, {
      addOns: activeGarment.addOns.filter((item) => item.id !== addOnId),
    });
  };

  if (!activeGarment) {
    return null;
  }

  const isActiveLocked = Boolean(activeGarment.isLocked);

  return (
    <div className="space-y-5">

      {/* =====================================================
          COMMON DUE DATE
      ===================================================== */}

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              All Garment Due Date
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              This date applies to every editable garment
              unless an individual date is enabled.
            </p>
          </div>

          <div className="w-full sm:w-[260px]">
            <DatePicker
              value={commonDueDate}
              onChange={(newDate) =>
                onCommonDueDateChange(newDate)
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="max-w-[260px] space-y-2">
          <Label htmlFor="sample-book-page-number">Sample Book Page Number</Label>
          <Input
            id="sample-book-page-number"
            value={sampleBookPageNumber}
            onChange={(event) => onSampleBookPageNumberChange(event.target.value)}
            placeholder="e.g. 4826"
          />
          <p className="text-xs text-muted-foreground">
            This is saved once on the order, not separately on each garment.
          </p>
        </div>
      </div>

      {/* =====================================================
          GARMENT TABS
      ===================================================== */}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {garments.map(
          (garment, index) => {
            const active =
              index === activeIndex;

            return (
              <div
                key={garment.localId}
                className="relative shrink-0"
              >
                <Button
                  type="button"
                  variant={
                    active
                      ? "default"
                      : "outline"
                  }
                  className={[
                    "rounded-full px-5",
                    active &&
                      "bg-slate-900 hover:bg-slate-800",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    setActiveIndex(index)
                  }
                >
                  #{index + 1}{" "}
                  {garment.serviceName ||
                    "Garment"}
                  {garment.isLocked && (
                    <Lock className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                  )}
                </Button>

                {garments.length > 1 &&
                  active &&
                  !garment.isLocked && (
                    <button
                      type="button"
                      onClick={() =>
                        removeGarment(index)
                      }
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white"
                      aria-label={`Remove garment ${
                        index + 1
                      }`}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
              </div>
            );
          },
        )}

        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-full border-dashed"
          onClick={addGarment}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* ===================================================
            GARMENT
        =================================================== */}

        <section className="rounded-xl border bg-card p-5">

          {isActiveLocked && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">
                  Garment Locked ({activeGarment.status?.replace("_", " ")})
                </span>
                {" — "}Cutting has already started for this garment, so its details, add-ons, and measurements cannot be edited or removed.
              </div>
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">
              Garment #{activeIndex + 1}
            </h2>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <Checkbox
                disabled={isActiveLocked}
                checked={
                  activeGarment.individualDueDateEnabled
                }
                onCheckedChange={(checked) =>
                  updateGarment(
                    activeIndex,
                    {
                      individualDueDateEnabled:
                        checked === true,

                      dueDate:
                        checked === true
                          ? activeGarment.dueDate ||
                            commonDueDate
                          : "",
                    },
                  )
                }
              />

              <Label className="text-xs font-normal">
                Enter individual due date
              </Label>
            </div>
          </div>

          {activeGarment.individualDueDateEnabled && (
            <div className="mb-5 max-w-[260px] space-y-2">
              <Label>
                Garment Due Date
              </Label>

              <DatePicker
                disabled={isActiveLocked}
                value={activeGarment.dueDate}
                onChange={(newDate) =>
                  updateGarment(activeIndex, {
                    dueDate: newDate,
                  })
                }
              />
            </div>
          )}

          <GarmentForm
            value={activeGarment}
            onChange={(updated) =>
              updateGarment(
                activeIndex,
                updated,
              )
            }
          />
        </section>

        {/* ===================================================
            ADD-ONS
        =================================================== */}

        <div className={isActiveLocked ? "pointer-events-none opacity-60" : ""}>
          <SelectedItemsPanel
            selectedAddOns={activeGarment.addOns}
            isLocked={isActiveLocked}
            onAdd={handleAddAddOn}
            onRemove={handleRemoveAddOn}
          />
        </div>
      </div>
    </div>
  );
}
