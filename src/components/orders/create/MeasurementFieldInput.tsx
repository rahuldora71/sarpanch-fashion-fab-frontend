import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  MeasurementFieldDefinition,
  MeasurementPrimitive,
} from "@/types/measurement";

interface MeasurementFieldInputProps {
  field: MeasurementFieldDefinition;
  value: MeasurementPrimitive;
  onChange: (value: string) => void;
  required?: boolean;
}

function normalizeInputValue(value: MeasurementPrimitive): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function MeasurementFieldInput({
  field,
  value,
  onChange,
  required = false,
}: MeasurementFieldInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const inputType =
    field.type?.toLowerCase() === "number" ||
    field.type?.toLowerCase() === "decimal"
      ? "number"
      : "text";

  return (
    <div className="space-y-2">
      <Label htmlFor={`measurement-field-${field.id}`}>
        {field.name}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      <div className="flex">
        <Input
          id={`measurement-field-${field.id}`}
          type={inputType}
          inputMode={inputType === "number" ? "decimal" : "text"}
          step={inputType === "number" ? "0.1" : undefined}
          value={normalizeInputValue(value)}
          onChange={handleChange}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className={field.unit ? "rounded-r-none" : undefined}
          required={required}
        />

        {field.unit && (
          <div className="flex min-w-12 items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
            {field.unit}
          </div>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-muted-foreground">
          {field.description}
        </p>
      )}
    </div>
  );
}
