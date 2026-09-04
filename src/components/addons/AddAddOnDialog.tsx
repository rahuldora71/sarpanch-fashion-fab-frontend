import {
  useState,
} from "react";

import {
  Loader2,
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
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  toast,
} from "react-hot-toast";

import {
  createAddOn,
} from "@/services/addOnService";

import {
  AddOnForm,
} from "./AddOnForm";

import type {
  AddOnRequest,
} from "@/types/addon";

import {
  ADDON_MESSAGES,
} from "@/constants/addon";

interface AddAddOnDialogProps {
  onCreated?: () => void;
}

const INITIAL_VALUE: AddOnRequest = {
  name: "",
  price: 0,
  tailorCommission: 0,
  imageUrl: "",
  imagePublicId: "",
  beforeCutting: false,
  active: true,
};

export function AddAddOnDialog({
  onCreated,
}: AddAddOnDialogProps) {
  const [open, setOpen] =
    useState(false);

  const [value, setValue] =
    useState<AddOnRequest>(
      INITIAL_VALUE,
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const reset = () => {
    setValue({
      ...INITIAL_VALUE,
    });

    setError(null);
  };

  const handleOpenChange = (
    nextOpen: boolean,
  ) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const validate = () => {
    if (!value.name.trim()) {
      return ADDON_MESSAGES.nameRequired;
    }

    if (
      !Number.isFinite(value.price) ||
      value.price < 0
    ) {
      return ADDON_MESSAGES.invalidPrice;
    }

    if (
      !Number.isFinite(
        value.tailorCommission,
      ) ||
      value.tailorCommission < 0
    ) {
      return ADDON_MESSAGES.invalidTailorCommission;
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createAddOn({
        name: value.name.trim(),

        price: value.price,

        tailorCommission:
          value.tailorCommission,

        imageUrl:
          value.imageUrl?.trim() || "",

        imagePublicId:
          value.imagePublicId?.trim() || "",

        beforeCutting:
          value.beforeCutting,

        active:
          value.active,
      });

      toast.success(
        ADDON_MESSAGES.createSuccess,
      );

      setOpen(false);

      reset();

      onCreated?.();
    } catch (err) {
      console.error(
        "Failed to create add-on:",
        err,
      );

      setError(
        ADDON_MESSAGES.createError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            size="default"
            className="h-10 rounded-lg px-4 font-medium shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add add-on
          </Button>
        }
      />

      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>
            Add new add-on
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AddOnForm
            value={value}
            onChange={setValue}
            disabled={submitting}
          />

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              handleOpenChange(false)
            }
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create add-on"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}