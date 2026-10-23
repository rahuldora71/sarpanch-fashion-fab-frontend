import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  getLatestMeasurement,
  getMeasurementCopySources,
  getServiceMeasurementConfig,
} from "@/services/measurementService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";

import { MeasurementCard } from "@/components/orders/create/MeasurementCard";
import { GarmentMeasurementCopyDialog } from "@/components/orders/create/GarmentMeasurementCopyDialog";
import type { OrderGarment } from "@/components/orders/create/GarmentsStep";

import type {
  MeasurementDraft,
  MeasurementFieldDefinition,
  MeasurementSourceSummary,
  ServiceMeasurementField,
} from "@/types/measurement";
import { copyCompatibleMeasurementValues } from "@/utils/measurementDraft";

interface MeasurementsStepProps {
  customerId: number | null;
  garments: OrderGarment[];
  measurements: Record<string, MeasurementDraft>;
  onChange: (measurements: Record<string, MeasurementDraft>) => void;
}

interface ServiceFieldState {
  fields: MeasurementFieldDefinition[];
  requiredFieldIds: number[];
}

function getServiceFields(
  configs: ServiceMeasurementField[],
  definitions: MeasurementFieldDefinition[],
): ServiceFieldState {
  const fields = configs
    .map((config) => {
      const globalField = definitions.find(
        (field) => field.id === config.fieldId,
      );

      if (!globalField) {
        return null;
      }

      return {
        ...globalField,
        unit: config.unit ?? globalField.unit ?? null,
        type: config.type ?? globalField.type ?? "text",
        displayOrder:
          config.displayOrder ??
          globalField.displayOrder ??
          999,
      };
    })
    .filter((field) => field !== null)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 999) -
        (b.displayOrder ?? 999),
    );

  return {
    fields,
    requiredFieldIds: configs
      .filter((config) => config.required === true)
      .map((config) => config.fieldId),
  };
}

function emptyDraft(
  garment: OrderGarment,
): MeasurementDraft {
  return {
    serviceId: garment.serviceId ?? 0,
    serviceName: garment.serviceName || "Garment",
    measurementFields: {},
    note: "",
    alterationNote: "",
    sourceMeasurementId: null,
  };
}

function serviceKey(
  serviceId: number | null,
): number | null {
  return typeof serviceId === "number"
    ? serviceId
    : null;
}

export function MeasurementsStep({
  customerId,
  garments,
  measurements,
  onChange,
}: MeasurementsStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { fields: fieldDefinitions } = useMeasurementFields();

  const [serviceFields, setServiceFields] =
    useState<Record<number, ServiceFieldState>>({});

  const [latestMeasurements, setLatestMeasurements] =
    useState<Record<number, MeasurementSourceSummary | null>>({});

  const [copySources, setCopySources] =
    useState<Record<number, MeasurementSourceSummary[]>>({});

  const [loadingServices, setLoadingServices] =
    useState<Record<number, boolean>>({});

  const [loadingLatest, setLoadingLatest] =
    useState<Record<number, boolean>>({});

  const [loadingSources, setLoadingSources] =
    useState<Record<number, boolean>>({});

  const [sourceDialogIndex, setSourceDialogIndex] =
    useState<number | null>(null);

  const [garmentCopyDialogIndex, setGarmentCopyDialogIndex] =
    useState<number | null>(null);

  const activeGarment = garments[activeIndex];

  const serviceIds = useMemo(
    () =>
      Array.from(
        new Set(
          garments
            .map((garment) => serviceKey(garment.serviceId))
            .filter(
              (id): id is number =>
                id !== null,
            ),
        ),
      ),
    [garments],
  );



  /* ---------------------------------------------------------
     Service measurement configuration
  --------------------------------------------------------- */

  useEffect(() => {
    if (fieldDefinitions.length === 0 || serviceIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadServiceFields() {
      await Promise.all(
        serviceIds.map(async (serviceId) => {
          setLoadingServices((current) => ({
            ...current,
            [serviceId]: true,
          }));

          try {
            const service =
              await getServiceMeasurementConfig(
                serviceId,
              );

            if (cancelled) return;

            setServiceFields((current) => ({
              ...current,
              [serviceId]: getServiceFields(
                service.measurementFields ?? [],
                fieldDefinitions,
              ),
            }));
          } catch (error) {
            console.error(
              `Failed to load measurement configuration for service ${serviceId}:`,
              error,
            );

            if (!cancelled) {
              setServiceFields((current) => ({
                ...current,
                [serviceId]: {
                  fields: [],
                  requiredFieldIds: [],
                },
              }));
            }
          } finally {
            if (!cancelled) {
              setLoadingServices((current) => ({
                ...current,
                [serviceId]: false,
              }));
            }
          }
        }),
      );
    }

    void loadServiceFields();

    return () => {
      cancelled = true;
    };
  }, [fieldDefinitions, serviceIds]);

  /* ---------------------------------------------------------
     Latest measurement
  --------------------------------------------------------- */

  useEffect(() => {
    if (!customerId || serviceIds.length === 0) {
      const clearLatestMeasurements = window.setTimeout(
        () => setLatestMeasurements({}),
        0,
      );

      return () =>
        window.clearTimeout(clearLatestMeasurements);
    }

    let cancelled = false;
    const selectedCustomerId = customerId;

    async function loadLatest() {
      await Promise.all(
        serviceIds.map(async (serviceId) => {
          setLoadingLatest((current) => ({
            ...current,
            [serviceId]: true,
          }));

          try {
            const latest =
              await getLatestMeasurement(
                selectedCustomerId,
                serviceId,
              );

            if (!cancelled) {
              setLatestMeasurements(
                (current) => ({
                  ...current,
                  [serviceId]: latest,
                }),
              );
            }
          } catch (error) {
            console.error(
              `Failed to load latest measurement for service ${serviceId}:`,
              error,
            );

            if (!cancelled) {
              setLatestMeasurements(
                (current) => ({
                  ...current,
                  [serviceId]: null,
                }),
              );
            }
          } finally {
            if (!cancelled) {
              setLoadingLatest((current) => ({
                ...current,
                [serviceId]: false,
              }));
            }
          }
        }),
      );
    }

    void loadLatest();

    return () => {
      cancelled = true;
    };
  }, [customerId, serviceIds]);

  /* ---------------------------------------------------------
     Draft update
  --------------------------------------------------------- */

  const updateMeasurement = (
    index: number,
    updates: Partial<MeasurementDraft>,
  ) => {
    const garment = garments[index];

    if (!garment || garment.serviceId === null || garment.isLocked) {
      return;
    }

    const key = garment.localId;
    const current =
      measurements[key] ?? emptyDraft(garment);

    onChange({
      ...measurements,
      [key]: {
        ...current,
        ...updates,
      },
    });
  };

 const copyFromSource = (
  index: number,
  source: MeasurementSourceSummary,
) => {
  const garment = garments[index];

  if (!garment || garment.serviceId === null) {
    return;
  }

  const fields =
    serviceFields[garment.serviceId]?.fields ?? [];

  updateMeasurement(index, {
    measurementFields:
      copyCompatibleMeasurementValues(
        source,
        fields,
      ),

    /*
     * Keep the original measurement ID.
     *
     * Backend will compare the supplied measurementFields
     * with the existing measurement before deciding whether
     * to reuse it or create a new measurement.
     */
    sourceMeasurementId: source.id,
  });

  setSourceDialogIndex(null);
};


const applyLatestMeasurement = (
  index: number,
) => {
  const garment = garments[index];

  if (!garment || garment.serviceId === null) {
    return;
  }

  const latest =
    latestMeasurements[garment.serviceId];

  if (!latest) {
    return;
  }

  copyFromSource(index, latest);
};


const copyFromAnotherGarment = (
  targetIndex: number,
  sourceIndex: number,
) => {
  const target = garments[targetIndex];
  const source = garments[sourceIndex];

  if (!target || !source || target.serviceId === null) {
    return;
  }

  const sourceDraft =
    measurements[source.localId];

  if (!sourceDraft) {
    setGarmentCopyDialogIndex(null);
    return;
  }

  const fields =
    serviceFields[target.serviceId]?.fields ?? [];

  const allowedIds = new Set(
    fields.map((field) => String(field.id)),
  );

  const compatibleValues =
    Object.fromEntries(
      Object.entries(
        sourceDraft.measurementFields ?? {},
      ).filter(([fieldId]) =>
        allowedIds.has(String(fieldId)),
      ),
    );

  updateMeasurement(targetIndex, {
    measurementFields: compatibleValues,

    /*
     * IMPORTANT:
     *
     * If the source garment is already using a database
     * measurement, keep that ID.
     *
     * Backend will verify whether the copied values are
     * still identical to that measurement.
     */
    sourceMeasurementId:
      sourceDraft.sourceMeasurementId ?? null,
  });

  setGarmentCopyDialogIndex(null);
};

 

  const garmentCopyOptions = garments.map(
    (garment, index) => ({
      index,
      name:
        garment.serviceName || "Garment",
      fieldCount: Object.keys(
        measurements[garment.localId]
          ?.measurementFields ?? {},
      ).length,
    }),
  );

  const loadCopySources = async (
    index: number,
  ) => {
    if (!customerId) return;

    const garment = garments[index];

    if (
      !garment ||
      garment.serviceId === null
    ) {
      return;
    }

    const serviceId = garment.serviceId;

    setSourceDialogIndex(index);
    setLoadingSources((current) => ({
      ...current,
      [serviceId]: true,
    }));

    try {
      const response =
        await getMeasurementCopySources(
          customerId,
          serviceId,
        );

      setCopySources((current) => ({
        ...current,
        [serviceId]: response,
      }));
    } catch (error) {
      console.error(
        "Failed to load measurement copy sources:",
        error,
      );

      setCopySources((current) => ({
        ...current,
        [serviceId]: [],
      }));
    } finally {
      setLoadingSources((current) => ({
        ...current,
        [serviceId]: false,
      }));
    }
  };

  /* ---------------------------------------------------------
     Empty states
  --------------------------------------------------------- */

  if (!customerId) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Ruler className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Select a customer first
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Measurements belong to the selected customer.
        </p>
      </div>
    );
  }

  if (garments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Ruler className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          No garments added
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Go back to Fabric & Garments and add a garment first.
        </p>
      </div>
    );
  }

  if (!activeGarment) {
    return null;
  }

  if (activeGarment.serviceId === null) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Ruler className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Select a tailoring service
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Measurement fields are based on the garment's tailoring service.
        </p>
      </div>
    );
  }

  const serviceId = activeGarment.serviceId;

  const draft =
    measurements[activeGarment.localId] ??
    emptyDraft(activeGarment);

  const fieldState =
    serviceFields[serviceId];

  const sources =
    copySources[serviceId] ?? [];

  const latest =
    latestMeasurements[serviceId] ?? null;

  const loadingFieldState =
    loadingServices[serviceId] ||
    !fieldState;

  return (
    <div className="space-y-5">
      {/* =====================================================
          GARMENT TABS
      ===================================================== */}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {garments.map((garment, index) => {
          const active = index === activeIndex;

          return (
            <Button
              key={garment.localId}
              type="button"
              variant={active ? "default" : "outline"}
              className={[
                "shrink-0 rounded-full px-5",
                active &&
                "bg-slate-900 hover:bg-slate-800",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveIndex(index)}
            >
              #{index + 1}{" "}
              {garment.serviceName || "Garment"}
              {garment.isLocked && (
                <Lock className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
              )}
            </Button>
          );
        })}
      </div>

      {loadingFieldState ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading measurement fields...
          </div>
        </div>
      ) : (
        <MeasurementCard
          garmentNumber={activeIndex + 1}
          garmentName={
            activeGarment.serviceName || "Garment"
          }
          isLocked={Boolean(activeGarment.isLocked)}
          draft={draft}
          fields={fieldState.fields}
          requiredFieldIds={
            fieldState.requiredFieldIds
          }
          latestMeasurement={latest}
          copySources={sources}
          loadingLatest={
            loadingLatest[serviceId] ?? false
          }
          loadingSources={
            loadingSources[serviceId] ?? false
          }
          sourceDialogOpen={
            sourceDialogIndex === activeIndex
          }
          onSourceDialogChange={(open) =>
            setSourceDialogIndex(
              open ? activeIndex : null,
            )
          }
          onOpenSourceDialog={() =>
            void loadCopySources(activeIndex)
          }
          onCopySource={(source) =>
            copyFromSource(
              activeIndex,
              source,
            )
          }
          onOpenGarmentCopyDialog={() =>
            setGarmentCopyDialogIndex(
              activeIndex,
            )
          }
          onUseLatest={() =>
            applyLatestMeasurement(activeIndex)
          }
          onChangeValues={(values) =>
            updateMeasurement(activeIndex, {
              measurementFields: values,
            })
          }
          onChangeNote={(value) =>
            updateMeasurement(activeIndex, {
              note: value,
            })
          }
          onChangeAlterationNote={(value) =>
            updateMeasurement(activeIndex, {
              alterationNote: value,
            })
          }
        />
      )}

      <GarmentMeasurementCopyDialog
        open={
          garmentCopyDialogIndex ===
          activeIndex
        }
        onOpenChange={(open) =>
          setGarmentCopyDialogIndex(
            open ? activeIndex : null,
          )
        }
        currentIndex={activeIndex}
        garments={garmentCopyOptions}
        onSelect={(sourceIndex) =>
          copyFromAnotherGarment(
            activeIndex,
            sourceIndex,
          )
        }
      />
    </div>
  );
}
