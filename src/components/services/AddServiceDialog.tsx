import {
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ServiceForm,
} from "./ServiceForm";

import {
  createService,
} from "@/services/serviceService";

import type {
  Service,
  ServiceCreateRequest,
} from "@/types/service";


// =========================================================
// PROPS
// =========================================================

interface AddServiceDialogProps {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  categories: string[];

  onCreated: (
    service: Service,
  ) => void;
}


// =========================================================
// INITIAL FORM
// =========================================================

const createInitialForm =
  (): ServiceCreateRequest => ({
    name: "",
    category: "",
    price: 0,
    active: true,
    tailorCommission: 0,
    measurementFields: [],
  });


// =========================================================
// COMPONENT
// =========================================================

export function AddServiceDialog({
  open,
  onOpenChange,
  categories,
  onCreated,
}: AddServiceDialogProps) {

  const [form, setForm] =
    useState<ServiceCreateRequest>(
      createInitialForm(),
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // =======================================================
  // OPEN / CLOSE
  // =======================================================

  const handleOpenChange = (
    nextOpen: boolean,
  ) => {

    if (!nextOpen) {

      setForm(
        createInitialForm(),
      );

      setError(null);

    }

    onOpenChange(nextOpen);

  };


  // =======================================================
  // VALIDATION
  // =======================================================

  const validateForm = () => {

    if (!form.name.trim()) {
      return "Service name is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (form.price < 0) {
      return "Price cannot be negative.";
    }

    if (
      form.tailorCommission < 0
    ) {
      return (
        "Tailor commission cannot be negative."
      );
    }

    if (
      form.tailorCommission >
      form.price
    ) {
      return (
        "Tailor commission cannot be greater than service price."
      );
    }


    /*
     * Measurement fields now come from the backend.
     *
     * Therefore we only need to make sure that a valid
     * fieldId exists and that the same field isn't selected
     * twice.
     */

    const fieldIds =
      new Set<number>();


    for (
      const field
      of form.measurementFields
    ) {

      if (!field.fieldId) {
        return (
          "Invalid measurement field selected."
        );
      }

      if (
        fieldIds.has(
          field.fieldId,
        )
      ) {
        return (
          "The same measurement field cannot be added twice."
        );
      }

      fieldIds.add(
        field.fieldId,
      );

    }


    return null;

  };


  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {

    event.preventDefault();


    const validationError =
      validateForm();


    if (validationError) {

      setError(
        validationError,
      );

      return;

    }


    try {

      setSaving(true);
      setError(null);


      const service =
        await createService({

          ...form,

          name:
            form.name.trim(),

          category:
            form.category.trim(),

          measurementFields:
            form.measurementFields.map(
              (
                field,
                index,
              ) => ({
                ...field,

                displayOrder:
                  index + 1,
              }),
            ),

        });


      onCreated(service);

      handleOpenChange(false);

    } catch (err) {

      console.error(
        "Unable to create service:",
        err,
      );

      setError(
        "Unable to create service. Please try again.",
      );

    } finally {

      setSaving(false);

    }

  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >

      <DialogContent
        className="
          flex
          h-[92dvh]
          max-h-[92dvh]
          w-[calc(100%-1rem)]
          max-w-2xl
          flex-col
          overflow-hidden
          p-0
          sm:h-[90vh]
          sm:max-h-[90vh]
          sm:w-full
          sm:p-6
        "
      >

        {/* ================================================= */}
        {/* HEADER                                            */}
        {/* ================================================= */}

        <DialogHeader
          className="
            shrink-0
            border-b
            px-4
            py-4
            sm:border-b-0
            sm:px-0
            sm:py-0
          "
        >

          <DialogTitle>
            Add Service
          </DialogTitle>

        </DialogHeader>


        {/* ================================================= */}
        {/* FORM                                              */}
        {/* ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >

          {/* ================================================= */}
          {/* BODY                                              */}
          {/* ================================================= */}

          <div
            className="
              min-h-0
              flex-1
              overflow-hidden
              px-4
              py-4
              sm:px-0
              sm:py-0
            "
          >

            <ServiceForm
              value={form}
              categories={categories}
              onChange={setForm}
            />

          </div>


          {/* ================================================= */}
          {/* ERROR                                             */}
          {/* ================================================= */}

          {error && (

            <div
              className="
                shrink-0
                border-t
                border-destructive/20
                bg-destructive/10
                px-4
                py-2
                text-sm
                text-destructive
                sm:px-0
              "
            >
              {error}
            </div>

          )}


          {/* ================================================= */}
          {/* FOOTER                                            */}
          {/* ================================================= */}

          <div
            className="
              flex
              shrink-0
              justify-end
              gap-2
              border-t
              bg-background
              px-4
              py-3
              sm:px-0
              sm:pt-4
            "
          >

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleOpenChange(false)
              }
              disabled={saving}
            >
              Cancel
            </Button>


            <Button
              type="submit"
              disabled={saving}
            >

              <Plus className="mr-1.5 h-4 w-4" />

              {saving
                ? "Adding..."
                : "Add Service"}

            </Button>

          </div>

        </form>

      </DialogContent>

    </Dialog>
  );
}