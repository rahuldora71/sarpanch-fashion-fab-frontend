import {
  GripVertical,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  MeasurementField,
} from "@/types/service";


interface MeasurementFieldEditorProps {
  field: MeasurementField;

  index: number;

  onChange: (
    field: MeasurementField,
  ) => void;

  onRemove: () => void;
}


const measurementTypes = [
  {
    value: "number",
    label: "Number",
  },
  {
    value: "text",
    label: "Text",
  },
];


const measurementUnits = [
  {
    value: "INCH",
    label: "Inch",
  },
  {
    value: "CM",
    label: "Centimeter",
  },
  {
    value: "NONE",
    label: "No Unit",
  },
];


export function MeasurementFieldEditor({
  field,
  index,
  onChange,
  onRemove,
}: MeasurementFieldEditorProps) {

  const updateField = (
    changes: Partial<MeasurementField>,
  ) => {
    onChange({
      ...field,
      ...changes,
    });
  };


  return (
    <div className="rounded-lg border border-border bg-card p-4">

      {/* ================================================= */}
      {/* HEADER                                            */}
      {/* ================================================= */}

      <div className="mb-4 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <GripVertical className="h-4 w-4 text-muted-foreground" />

          <p className="text-sm font-medium">
            Measurement {index + 1}
          </p>

        </div>


        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
          title="Remove measurement"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

      </div>


      {/* ================================================= */}
      {/* FIELDS                                            */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2">

        {/* ------------------------------------------------ */}
        {/* KEY                                              */}
        {/* ------------------------------------------------ */}

        <div className="space-y-2">

          <Label>
            Key
          </Label>

          <Input
            value={field.key}
            onChange={(event) =>
              updateField({
                key:
                  event.target.value
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      "_",
                    ),
              })
            }
            placeholder="e.g. chest"
          />

          <p className="text-xs text-muted-foreground">
            Unique identifier used by the system.
          </p>

        </div>


        {/* ------------------------------------------------ */}
        {/* LABEL                                            */}
        {/* ------------------------------------------------ */}

        <div className="space-y-2">

          <Label>
            Label
          </Label>

          <Input
            value={field.label}
            onChange={(event) =>
              updateField({
                label:
                  event.target.value,
              })
            }
            placeholder="e.g. Chest"
          />

        </div>


        {/* ------------------------------------------------ */}
        {/* UNIT                                             */}
        {/* ------------------------------------------------ */}

        <div className="space-y-2">

          <Label>
            Unit
          </Label>

          <Select
            value={field.unit ?? ""}
            onValueChange={(value) =>
              updateField({
                unit: value ?? "",
              })
            }
          >

            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>


            <SelectContent>

              {measurementUnits.map(
                (unit) => (
                  <SelectItem
                    key={unit.value}
                    value={unit.value}
                  >
                    {unit.label}
                  </SelectItem>
                ),
              )}

            </SelectContent>

          </Select>

        </div>


        {/* ------------------------------------------------ */}
        {/* INPUT TYPE                                       */}
        {/* ------------------------------------------------ */}

        <div className="space-y-2">

          <Label>
            Input Type
          </Label>

          <Select
            value={field.type ?? ""}
            onValueChange={(value) =>
              updateField({
                type: value ?? "",
              })
            }
          >

            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>


            <SelectContent>

              {measurementTypes.map(
                (type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </SelectItem>
                ),
              )}

            </SelectContent>

          </Select>

        </div>


        {/* ------------------------------------------------ */}
        {/* DISPLAY ORDER                                    */}
        {/* ------------------------------------------------ */}

        <div className="space-y-2">

          <Label>
            Display Order
          </Label>

          <Input
            type="number"
            min={1}
            step={1}
            value={
              field.displayOrder
            }
            onChange={(event) =>
              updateField({
                displayOrder:
                  Number(
                    event.target.value,
                  ) || 1,
              })
            }
          />

        </div>


        {/* ------------------------------------------------ */}
        {/* REQUIRED                                         */}
        {/* ------------------------------------------------ */}

        <div className="flex items-center gap-3 sm:pt-7">

          <Checkbox
            id={`required-${index}`}
            checked={
              field.required
            }
            onCheckedChange={(
              checked,
            ) =>
              updateField({
                required:
                  checked === true,
              })
            }
          />

          <Label
            htmlFor={`required-${index}`}
            className="cursor-pointer"
          >
            Required measurement
          </Label>

        </div>

      </div>

    </div>
  );
}
