import { MeasurementFieldInput } from "@/components/orders/create/MeasurementFieldInput";

import type {
  MeasurementFieldDefinition,
  MeasurementFieldValues,
} from "@/types/measurement";

interface MeasurementFieldsGridProps {
  fields: MeasurementFieldDefinition[];
  values: MeasurementFieldValues;
  requiredFieldIds?: number[];
  onChange: (values: MeasurementFieldValues) => void;
}

export function MeasurementFieldsGrid({
  fields,
  values,
  requiredFieldIds = [],
  onChange,
}: MeasurementFieldsGridProps) {
  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">
          No measurement fields configured
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add measurement fields to this service before taking measurements.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {fields.map((field) => (
        <MeasurementFieldInput
          key={field.id}
          field={field}
          value={values[String(field.id)] ?? ""}
          required={requiredFieldIds.includes(field.id)}
          onChange={(value) =>
            onChange({
              ...values,
              [String(field.id)]: value,
            })
          }
        />
      ))}
    </div>
  );
}
