import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GarmentForm } from "@/components/orders/create/GarmentForm";
import { SelectedItemsPanel } from "@/components/orders/create/SelectedItemsPanel";

import {
  getActiveAddOns,
  searchAddOns,
} from "@/services/addOnService";

import type {
  GarmentFormValue,
  SelectedOrderAddOn,
} from "@/types/order";

export type OrderGarment = GarmentFormValue & {
  localId: string;
  individualDueDateEnabled: boolean;
  dueDate: string;
};

export interface GarmentsStepProps {
  garments: OrderGarment[];
  commonDueDate: string;
  onChange: (garments: OrderGarment[]) => void;
  onCommonDueDateChange: (value: string) => void;
}

export function createEmptyGarment(sequence = 1): OrderGarment {
  return {
    localId: crypto.randomUUID(),

    serviceId: null,
    serviceName: "",
    price: 0,

    sampleNumber: String(sequence),
    sampleId: "",
    bookNumber: "",
    pageNumber: "",
    notes: "",

    addOns: [],

    individualDueDateEnabled: false,
    dueDate: "",
  };
}

export function GarmentsStep({
  garments,
  commonDueDate,
  onChange,
  onCommonDueDateChange,
}: GarmentsStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [addOnSearch, setAddOnSearch] = useState("");

  const [availableAddOns, setAvailableAddOns] = useState<
    SelectedOrderAddOn[]
  >([]);

  const [loadingAddOns, setLoadingAddOns] = useState(false);

  const activeGarment =
    garments[activeIndex] ?? garments[0];

  const selectedAddOnIds = useMemo(
    () =>
      activeGarment?.addOns.map(
        (item) => item.id,
      ) ?? [],
    [activeGarment],
  );

  /*
   * Load active add-ons globally.
   *
   * Add-ons are NOT connected to a tailoring service.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAddOns() {
      try {
        setLoadingAddOns(true);

        const response = addOnSearch.trim()
          ? await searchAddOns(
              addOnSearch.trim(),
              0,
              50,
              "name,asc",
            )
          : await getActiveAddOns(
              0,
              50,
              "name,asc",
            );

        if (cancelled) return;

        setAvailableAddOns(
          (response.content ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price ?? 0),
            tailorCommission: Number(
              item.tailorCommission ?? 0,
            ),
            imageUrl: item.imageUrl ?? null,
            beforeCutting: item.beforeCutting,
            quantity: 1,
            totalPrice: Number(item.price ?? 0),
          })),
        );
      } catch (error) {
        console.error(
          "Failed to load add-ons:",
          error,
        );

        if (!cancelled) {
          setAvailableAddOns([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAddOns(false);
        }
      }
    }

    void loadAddOns();

    return () => {
      cancelled = true;
    };
  }, [addOnSearch]);

  const updateGarment = (
    index: number,
    updates: Partial<OrderGarment>,
  ) => {
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

  const toggleAddOn = (
    addOn: SelectedOrderAddOn,
  ) => {
    if (!activeGarment) {
      return;
    }

    const exists =
      activeGarment.addOns.some(
        (item) => item.id === addOn.id,
      );

    updateGarment(activeIndex, {
      addOns: exists
        ? activeGarment.addOns.filter(
            (item) =>
              item.id !== addOn.id,
          )
        : [
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

  if (!activeGarment) {
    return null;
  }

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
              This date applies to every garment
              unless an individual date is enabled.
            </p>
          </div>

          <div className="relative w-full sm:w-[220px]">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              type="date"
              value={commonDueDate}
              onChange={(event) =>
                onCommonDueDateChange(
                  event.target.value,
                )
              }
              className="pl-10"
            />
          </div>
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
                </Button>

                {garments.length > 1 &&
                  active && (
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

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">
              Garment #{activeIndex + 1}
            </h2>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <Checkbox
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
            <div className="mb-5 max-w-[220px] space-y-2">
              <Label>
                Garment Due Date
              </Label>

              <Input
                type="date"
                value={
                  activeGarment.dueDate
                }
                onChange={(event) =>
                  updateGarment(
                    activeIndex,
                    {
                      dueDate:
                        event.target.value,
                    },
                  )
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

        <div className="space-y-3">

          <div className="rounded-xl border bg-card p-4">

            <div className="mb-3">
              <h3 className="text-sm font-semibold">
                Add-ons
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Search and add optional work to this garment.
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={addOnSearch}
                onChange={(event) =>
                  setAddOnSearch(
                    event.target.value,
                  )
                }
                placeholder="Search add-ons..."
                className="pl-9"
              />
            </div>
          </div>

          <SelectedItemsPanel
            addOns={availableAddOns}
            selectedAddOnIds={
              selectedAddOnIds
            }
            loading={loadingAddOns}
            onToggle={toggleAddOn}
          />
        </div>
      </div>
    </div>
  );
}
