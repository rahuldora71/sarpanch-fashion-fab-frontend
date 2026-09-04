import type {
  MeasurementDraft,
  MeasurementFieldDefinition,
  MeasurementFieldValues,
  MeasurementSourceSummary,
} from "@/types/measurement";

export function createMeasurementDraft(
  serviceId: number,
  serviceName: string,
): MeasurementDraft {
  return {
    serviceId,
    serviceName,
    measurementFields: {},
    note: "",
    alterationNote: "",
    sourceMeasurementId: null,
  };
}

/**
 * Copy only fields that belong to the current service.
 *
 * Copy-source measurements can come from another service, so they may
 * contain fields that the current garment does not use.
 */
export function copyCompatibleMeasurementValues(
  source: MeasurementSourceSummary,
  currentFields: MeasurementFieldDefinition[],
): MeasurementFieldValues {
  const allowedIds = new Set(
    currentFields.map((field) => String(field.id)),
  );

  return Object.fromEntries(
    Object.entries(source.measurementFields ?? {}).filter(
      ([fieldId]) => allowedIds.has(String(fieldId)),
    ),
  );
}
