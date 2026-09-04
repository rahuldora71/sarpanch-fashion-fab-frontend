import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GripVertical,
  Loader2,
  Plus,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  MeasurementFieldPickerDialog,
} from "./MeasurementFieldPickerDialog";

import {
  getMeasurementFields,
} from "@/services/measurementFieldService";

import type {
  ServiceCreateRequest,
  ServiceMeasurementField,
} from "@/types/service";

import type {
  MeasurementField,
} from "@/types/measurementField";


// =========================================================
// PROPS
// =========================================================

interface ServiceFormProps {
  value: ServiceCreateRequest;

  categories: string[];

  onChange: (
    value: ServiceCreateRequest,
  ) => void;
}


// =========================================================
// OPTIONS
// =========================================================

const UNIT_OPTIONS = [
  "INCH",
  "CM",
  "MM",
];

const TYPE_OPTIONS = [
  "number",
  "text",
];


// =========================================================
// COMPONENT
// =========================================================

export function ServiceForm({
  value,
  categories,
  onChange,
}: ServiceFormProps) {

  // =======================================================
  // STATE
  // =======================================================

  const [
    fieldPickerOpen,
    setFieldPickerOpen,
  ] = useState(false);

  const [
    measurementFields,
    setMeasurementFields,
  ] = useState<MeasurementField[]>([]);

  const [
    loadingFields,
    setLoadingFields,
  ] = useState(true);


  // =======================================================
  // CATEGORY OPTIONS
  // =======================================================

  /*
   * Always include the currently selected category.
   *
   * This is important for EDIT mode because the category
   * might not exist in the current categories list.
   */
const [isOtherCategory, setIsOtherCategory] = useState(false);
const [customCategory, setCustomCategory] = useState("");
  const categoryOptions = useMemo(() => {
  const options = [
    ...categories,
    value.category?.trim() || "",
    "Other",
  ];

  return Array.from(
    new Set(
      options
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;

    return a.localeCompare(b);
  });
}, [categories, value.category]);


  // =======================================================
  // LOAD GLOBAL MEASUREMENT FIELDS
  // =======================================================

  useEffect(() => {

    let cancelled = false;

    const loadFields = async () => {

      try {

        setLoadingFields(true);

        const response =
          await getMeasurementFields(
            0,
            100,
            "name,asc",
          );

        if (!cancelled) {

          setMeasurementFields(
            response.content ?? [],
          );

        }

      } catch (error) {

        console.error(
          "Unable to load measurement fields:",
          error,
        );

      } finally {

        if (!cancelled) {
          setLoadingFields(false);
        }

      }

    };

    loadFields();

    return () => {
      cancelled = true;
    };

  }, []);


  // =======================================================
  // ADD MEASUREMENT FIELD
  // =======================================================

  const handleAddField = (
    field: MeasurementField,
  ) => {

    /*
     * Do not allow the same measurement field to be
     * selected more than once.
     */

    const exists =
      value.measurementFields.some(
        (item) =>
          item.fieldId === field.id,
      );

    if (exists) {
      return;
    }


    const newField:
      ServiceMeasurementField = {

      fieldId:
        field.id,

      unit:
        "INCH",

      required:
        true,

      type:
        "number",

      displayOrder:
        value.measurementFields.length + 1,
    };


    onChange({
      ...value,

      measurementFields: [
        ...value.measurementFields,
        newField,
      ],
    });

  };


  // =======================================================
  // UPDATE FIELD
  // =======================================================

  const updateField = (
    index: number,
    changes: Partial<ServiceMeasurementField>,
  ) => {

    onChange({
      ...value,

      measurementFields:
        value.measurementFields.map(
          (
            field,
            fieldIndex,
          ) =>
            fieldIndex === index
              ? {
                ...field,
                ...changes,
              }
              : field,
        ),
    });

  };


  // =======================================================
  // REMOVE FIELD
  // =======================================================

  const removeField = (
    index: number,
  ) => {

    const fields =
      value.measurementFields
        .filter(
          (_, fieldIndex) =>
            fieldIndex !== index,
        )
        .map(
          (
            field,
            fieldIndex,
          ) => ({
            ...field,

            displayOrder:
              fieldIndex + 1,
          }),
        );


    onChange({
      ...value,

      measurementFields:
        fields,
    });

  };


  // =======================================================
  // MOVE FIELD
  // =======================================================

  const moveField = (
    index: number,
    direction: "up" | "down",
  ) => {

    const target =
      direction === "up"
        ? index - 1
        : index + 1;


    if (
      target < 0 ||
      target >=
      value.measurementFields.length
    ) {
      return;
    }


    const fields = [
      ...value.measurementFields,
    ];


    [
      fields[index],
      fields[target],
    ] = [
        fields[target],
        fields[index],
      ];


    onChange({
      ...value,

      measurementFields:
        fields.map(
          (
            field,
            fieldIndex,
          ) => ({
            ...field,

            displayOrder:
              fieldIndex + 1,
          }),
        ),
    });

  };


  // =======================================================
  // GET FIELD DETAILS
  // =======================================================

  const getMeasurementField = (
    fieldId: number,
  ) => {

    return measurementFields.find(
      (field) =>
        field.id === fieldId,
    );

  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <>
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
        "
      >

        {/* ================================================= */}
        {/* SERVICE INFORMATION                              */}
        {/* ================================================= */}

        <div
          className="
            shrink-0
            space-y-5
            pb-6
          "
        >

          <div>

            <h3 className="text-sm font-semibold">
              Service Information
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Define the service and its pricing.
            </p>

          </div>


          {/* ================================================= */}
          {/* SERVICE NAME                                      */}
          {/* ================================================= */}

          <div className="space-y-2">

            <Label htmlFor="service-name">
              Service Name
            </Label>

            <Input
              id="service-name"
              value={value.name}
              maxLength={150}
              onChange={(event) =>
                onChange({
                  ...value,

                  name:
                    event.target.value,
                })
              }
              placeholder="e.g. Formal Shirt"
            />

          </div>


          {/* ================================================= */}
          {/* CATEGORY                                          */}
          {/* ================================================= */}

          <div className="space-y-2">
  <Label htmlFor="service-category">
    Category
  </Label>

  <Select
    value={isOtherCategory ? "Other" : value.category?.trim() || ""}
    onValueChange={(category) => {
      if (category === "Other") {
        setIsOtherCategory(true);

        onChange({
          ...value,
          category: customCategory,
        });

        return;
      }

      setIsOtherCategory(false);
      setCustomCategory("");

      onChange({
        ...value,
        category: category ?? "",
      });
    }}
  >
    <SelectTrigger id="service-category">
      <SelectValue placeholder="Select category" />
    </SelectTrigger>

    <SelectContent>
      {categoryOptions.map((category) => (
        <SelectItem
          key={category}
          value={category}
        >
          {category}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {isOtherCategory && (
    <Input
      placeholder="Enter category name"
      value={customCategory}
      onChange={(event) => {
        const category = event.target.value;

        setCustomCategory(category);

        onChange({
          ...value,
          category,
        });
      }}
    />
  )}
</div>


          {/* ================================================= */}
          {/* PRICE                                             */}
          {/* ================================================= */}

          <div className="space-y-2">

            <Label htmlFor="service-price">
              Service Price (₹)
            </Label>

            <Input
              id="service-price"
              type="number"
              min={0}
              step="1"
              value={value.price}
              onChange={(event) =>
                onChange({
                  ...value,

                  price:
                    Number(
                      event.target.value,
                    ) || 0,
                })
              }
              placeholder="350"
            />

          </div>


          {/* ================================================= */}
          {/* COMMISSION                                        */}
          {/* ================================================= */}

          <div className="space-y-2">

            <Label htmlFor="tailor-commission">
              Tailor Commission (₹)
            </Label>

            <Input
              id="tailor-commission"
              type="number"
              min={0}
              step="1"
              value={
                value.tailorCommission
              }
              onChange={(event) =>
                onChange({
                  ...value,

                  tailorCommission:
                    Number(
                      event.target.value,
                    ) || 0,
                })
              }
              placeholder="140"
            />

            <p className="text-xs text-muted-foreground">
              Amount paid to the tailor for
              completing this service.
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* MEASUREMENT SECTION                               */}
        {/* ================================================= */}

        <div
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >

          {/* ================================================= */}
          {/* MEASUREMENT HEADER                                */}
          {/* ================================================= */}

          <div
            className="
              flex
              shrink-0
              items-start
              justify-between
              gap-3
              border-t
              border-border
              py-4
            "
          >

            <div className="min-w-0">

              <h3 className="text-sm font-semibold">
                Measurement Fields
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Select reusable measurements
                for this service.
              </p>

            </div>


            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={
                loadingFields
              }
              onClick={() =>
                setFieldPickerOpen(true)
              }
            >

              {loadingFields ? (

                <Loader2
                  className="
                    mr-1.5
                    h-4
                    w-4
                    animate-spin
                  "
                />

              ) : (

                <Plus
                  className="
                    mr-1.5
                    h-4
                    w-4
                  "
                />

              )}

              <span className="hidden sm:inline">
                Add Field
              </span>

              <span className="sm:hidden">
                Add
              </span>

            </Button>

          </div>


          {/* ================================================= */}
          {/* SCROLLABLE MEASUREMENT LIST                       */}
          {/* ================================================= */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              pr-1
              pb-2
            "
          >

            {value.measurementFields.length ===
              0 ? (

              <div
                className="
                  flex
                  min-h-32
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-dashed
                  border-border
                  px-4
                  py-8
                  text-center
                "
              >

                <div>

                  <p className="text-sm font-medium">
                    No measurement fields
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Click Add Field to select
                    reusable measurements.
                  </p>

                </div>

              </div>

            ) : (

              <div className="space-y-3">

                {value.measurementFields.map(
                  (
                    field,
                    index,
                  ) => {

                    const measurement =
                      getMeasurementField(
                        field.fieldId,
                      );

                    return (
                      <div
                        key={
                          field.fieldId
                        }
                        className="
                          rounded-lg
                          border
                          border-border
                          bg-card
                          p-3
                          sm:p-4
                        "
                      >

                        {/* ================================= */}
                        {/* CARD HEADER                        */}
                        {/* ================================= */}

                        <div
                          className="
                            mb-4
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                        >

                          <div
                            className="
                              flex
                              min-w-0
                              items-center
                              gap-2
                            "
                          >

                            <GripVertical
                              className="
                                h-4
                                w-4
                                shrink-0
                                text-muted-foreground
                              "
                            />

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold">
                                {measurement?.name ??
                                  "Unknown measurement"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Measurement{" "}
                                {index + 1}
                              </p>

                            </div>

                          </div>


                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="
                              h-8
                              w-8
                              shrink-0
                              text-destructive
                              hover:text-destructive
                            "
                            onClick={() =>
                              removeField(
                                index,
                              )
                            }
                            title="Remove measurement"
                          >

                            <Trash2 className="h-4 w-4" />

                          </Button>

                        </div>


                        {/* ================================= */}
                        {/* OPTIONS                            */}
                        {/* ================================= */}

                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-4
                            sm:grid-cols-2
                          "
                        >

                          {/* =============================== */}
                          {/* UNIT                            */}
                          {/* =============================== */}

                          <div className="space-y-2">

                            <Label>
                              Unit
                            </Label>

                            <Select
                              value={
                                field.unit ?? ""
                              }
                              onValueChange={(
                                unit,
                              ) =>
                                updateField(
                                  index,
                                  {
                                    unit: unit ?? "",
                                  },
                                )
                              }
                            >

                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>

                                {UNIT_OPTIONS.map(
                                  (
                                    unit,
                                  ) => (

                                    <SelectItem
                                      key={
                                        unit
                                      }
                                      value={
                                        unit
                                      }
                                    >
                                      {unit}
                                    </SelectItem>

                                  ),
                                )}

                              </SelectContent>

                            </Select>

                          </div>


                          {/* =============================== */}
                          {/* INPUT TYPE                      */}
                          {/* =============================== */}

                          <div className="space-y-2">

                            <Label>
                              Input Type
                            </Label>

                            <Select
                              value={
                                field.type ?? ""
                              }
                              onValueChange={(
                                type,
                              ) =>
                                updateField(
                                  index,
                                  {
                                    type: type ?? "",
                                  },
                                )
                              }
                            >

                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>

                                {TYPE_OPTIONS.map(
                                  (
                                    type,
                                  ) => (

                                    <SelectItem
                                      key={
                                        type
                                      }
                                      value={
                                        type
                                      }
                                    >
                                      {type}
                                    </SelectItem>

                                  ),
                                )}

                              </SelectContent>

                            </Select>

                          </div>


                          {/* =============================== */}
                          {/* DISPLAY ORDER                   */}
                          {/* =============================== */}

                          <div className="space-y-2">

                            <Label>
                              Display Order
                            </Label>

                            <Input
                              type="number"
                              min={1}
                              value={
                                field.displayOrder
                              }
                              onChange={(
                                event,
                              ) =>
                                updateField(
                                  index,
                                  {
                                    displayOrder:
                                      Number(
                                        event
                                          .target
                                          .value,
                                      ) || 1,
                                  },
                                )
                              }
                            />

                          </div>


                          {/* =============================== */}
                          {/* REQUIRED                         */}
                          {/* =============================== */}

                          <div
                            className="
                              flex
                              min-h-10
                              items-center
                              gap-2
                            "
                          >

                            <Checkbox
                              id={`required-${field.fieldId}-${index}`}
                              checked={
                                field.required
                              }
                              onCheckedChange={(
                                checked,
                              ) =>
                                updateField(
                                  index,
                                  {
                                    required:
                                      checked ===
                                      true,
                                  },
                                )
                              }
                            />

                            <Label
                              htmlFor={`required-${field.fieldId}-${index}`}
                              className="cursor-pointer"
                            >
                              Required
                            </Label>

                          </div>

                        </div>


                        {/* ================================= */}
                        {/* ORDER BUTTONS                     */}
                        {/* ================================= */}

                        <div
                          className="
                            mt-4
                            flex
                            flex-wrap
                            gap-2
                          "
                        >

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              index === 0
                            }
                            onClick={() =>
                              moveField(
                                index,
                                "up",
                              )
                            }
                          >
                            Move Up
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              index ===
                              value
                                .measurementFields
                                .length -
                              1
                            }
                            onClick={() =>
                              moveField(
                                index,
                                "down",
                              )
                            }
                          >
                            Move Down
                          </Button>

                        </div>

                      </div>
                    );

                  },
                )}

              </div>

            )}

          </div>

        </div>

      </div>


      {/* =================================================== */}
      {/* MEASUREMENT FIELD PICKER                            */}
      {/* =================================================== */}

      <MeasurementFieldPickerDialog
        open={
          fieldPickerOpen
        }
        onOpenChange={
          setFieldPickerOpen
        }
        selectedFieldIds={
          value.measurementFields.map(
            (field) =>
              field.fieldId,
          )
        }
        onSelect={
          handleAddField
        }
      />

    </>
  );
}
