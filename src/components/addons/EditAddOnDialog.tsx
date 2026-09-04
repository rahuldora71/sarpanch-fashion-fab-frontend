import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
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
  toast,
} from "react-hot-toast";

import {
  getAddOnById,
  updateAddOn,
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

interface EditAddOnDialogProps {
  addOnId: number | null;

  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  onUpdated?: () => void;
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

export function EditAddOnDialog({
  addOnId,
  open,
  onOpenChange,
  onUpdated,
}: EditAddOnDialogProps) {
  const [value, setValue] =
    useState<AddOnRequest>(
      INITIAL_VALUE,
    );

  const [loading, setLoading] =
    useState(false);

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

  const loadAddOn =
    async (
      id: number,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const addOn =
          await getAddOnById(id);

        setValue({
          name:
            addOn.name ?? "",

          price:
            addOn.price ?? 0,

          tailorCommission:
            addOn.tailorCommission ??
            0,

          imageUrl:
            addOn.imageUrl ?? "",

          imagePublicId:
            addOn.imagePublicId ??
            "",

          beforeCutting:
            addOn.beforeCutting ??
            false,

          active:
            addOn.active ??
            true,
        });
      } catch (err) {
        console.error(
          "Failed to load add-on:",
          err,
        );

        setError(
          ADDON_MESSAGES.loadError,
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      !open ||
      !addOnId
    ) {
      return;
    }

    void loadAddOn(
      addOnId,
    );
  }, [
    open,
    addOnId,
  ]);

  const handleOpenChange = (
    nextOpen: boolean,
  ) => {
    onOpenChange(
      nextOpen,
    );

    if (!nextOpen) {
      reset();
    }
  };

  const validate = () => {
    if (!value.name.trim()) {
      return ADDON_MESSAGES.nameRequired;
    }

    if (
      !Number.isFinite(
        value.price,
      ) ||
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
    if (!addOnId) {
      return;
    }

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateAddOn(
        addOnId,
        {
          name:
            value.name.trim(),

          price:
            value.price,

          tailorCommission:
            value.tailorCommission,

          imageUrl:
            value.imageUrl?.trim() ||
            "",

          imagePublicId:
            value.imagePublicId?.trim() ||
            "",

          beforeCutting:
            value.beforeCutting,

          active:
            value.active,
        },
      );

      toast.success(
        ADDON_MESSAGES.updateSuccess,
      );

      onOpenChange(false);

      reset();

      onUpdated?.();
    } catch (err) {
      console.error(
        "Failed to update add-on:",
        err,
      );

      setError(
        ADDON_MESSAGES.updateError,
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
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>
            Edit add-on
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <AddOnForm
                value={value}
                onChange={
                  setValue
                }
                disabled={
                  submitting
                }
              />

              {error && (
                <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              handleOpenChange(
                false,
              )
            }
            disabled={
              submitting
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              loading ||
              submitting ||
              !addOnId
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}