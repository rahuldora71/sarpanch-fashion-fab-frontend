import {
  ImageUploader,
} from "@/components/common/ImageUploader";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Switch,
} from "@/components/ui/switch";

import type {
  AddOnRequest,
} from "@/types/addon";

import type {
  UploadedImage,
} from "@/types/image";

import {
  ADDON_IMAGE,
  ADDON_MESSAGES,
} from "@/constants/addon";

interface AddOnFormProps {
  value: AddOnRequest;

  onChange: (
    value: AddOnRequest,
  ) => void;

  disabled?: boolean;
}

export function AddOnForm({
  value,
  onChange,
  disabled = false,
}: AddOnFormProps) {
  const update = <
    K extends keyof AddOnRequest,
  >(
    field: K,
    fieldValue: AddOnRequest[K],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleNumberChange = (
    field:
      | "price"
      | "tailorCommission",
    rawValue: string,
  ) => {
    if (rawValue === "") {
      update(field, 0);
      return;
    }

    const parsed =
      Number(rawValue);

    if (
      Number.isFinite(parsed)
    ) {
      update(
        field,
        parsed,
      );
    }
  };

  const handleImageChange = (
    image: UploadedImage,
  ) => {
    onChange({
      ...value,

      imageUrl:
        image.imageUrl,

      imagePublicId:
        image.imagePublicId,
    });
  };

  const handleImageRemove = () => {
    onChange({
      ...value,

      imageUrl: "",

      imagePublicId: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="addon-name">
          Add-on name
        </Label>

        <Input
          id="addon-name"
          placeholder="e.g. Extra Pocket"
          value={value.name}
          onChange={(event) =>
            update(
              "name",
              event.target.value,
            )
          }
          disabled={disabled}
        />
      </div>

      {/* Price + Commission */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="addon-price">
            Price
          </Label>

          <Input
            id="addon-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={
              Number.isFinite(
                value.price,
              )
                ? value.price
                : ""
            }
            onChange={(event) =>
              handleNumberChange(
                "price",
                event.target.value,
              )
            }
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addon-commission">
            Tailor commission
          </Label>

          <Input
            id="addon-commission"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={
              Number.isFinite(
                value.tailorCommission,
              )
                ? value.tailorCommission
                : ""
            }
            onChange={(event) =>
              handleNumberChange(
                "tailorCommission",
                event.target.value,
              )
            }
            disabled={disabled}
          />

          <p className="text-xs text-muted-foreground">
            Amount paid to the tailor when
            this add-on is completed.
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="space-y-3">
        <Label>
          {ADDON_MESSAGES.uploadLabel}
        </Label>

        <ImageUploader
          value={{
            imageUrl:
              value.imageUrl ?? "",

            imagePublicId:
              value.imagePublicId ?? "",
          }}
          onChange={
            handleImageChange
          }
          onRemove={
            handleImageRemove
          }
          aspect={
            ADDON_IMAGE.aspect
          }
          maxSizeMB={
            ADDON_IMAGE.maxSizeMB
          }
          disabled={disabled}
        />
      </div>

      {/* Before cutting */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {
                ADDON_MESSAGES.beforeCuttingTitle
              }
            </p>

            <p className="text-sm text-muted-foreground">
              {
                ADDON_MESSAGES.beforeCuttingDescription
              }
            </p>
          </div>

          <Switch
            checked={
              value.beforeCutting
            }
            onCheckedChange={(
              checked,
            ) =>
              update(
                "beforeCutting",
                checked,
              )
            }
            disabled={disabled}
          />
        </div>
      </div>

      {/* Active */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {ADDON_MESSAGES.activeTitle}
            </p>

            <p className="text-sm text-muted-foreground">
              {
                ADDON_MESSAGES.activeDescription
              }
            </p>
          </div>

          <Switch
            checked={value.active}
            onCheckedChange={(
              checked,
            ) =>
              update(
                "active",
                checked,
              )
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}