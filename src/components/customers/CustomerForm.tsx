import { useState } from "react";
import { Camera, Loader2, Plus, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";

import { createCustomer } from "@/services/CustomerService";
import type { CustomerCreateRequest } from "@/models/CustomerCreateRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CustomerCameraCaptureModal, {
  type ImageCaptureMode,
} from "./CustomerCameraCaptureModal";
import { getCustomerImageSettings } from "@/services/customerSettingsService";

interface CustomerFormProps {
  onSuccess?: (customer: unknown) => void;
  onCancel?: () => void;
}

export default function CustomerForm({
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const settings = getCustomerImageSettings();

  const [formData, setFormData] =
    useState<CustomerCreateRequest>({
      name: "",
      phone: "",
      alternatePhone: "",
      email: "",
      address: "",
      city: "",
      notes: "",
    });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profilePublicId, setProfilePublicId] = useState<string | null>(null);
  const [postureImages, setPostureImages] = useState<
    Array<{ imageUrl: string; publicId: string; purpose: string }>
  >([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<ImageCaptureMode>("profile");
  const [defaultPurpose, setDefaultPurpose] = useState("FRONT_PROFILE");

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CustomerCreateRequest, string>>
  >({});


  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (
    field: keyof CustomerCreateRequest,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const newErrors: Partial<
      Record<keyof CustomerCreateRequest, string>
    > = {};

    if (!formData.name.trim()) {
      newErrors.name =
        "Customer name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required.";
    } else if (
      !/^[0-9]{10}$/.test(formData.phone)
    ) {
      newErrors.phone =
        "Phone number must contain 10 digits.";
    }

    if (
      formData.alternatePhone &&
      !/^[0-9]{10}$/.test(
        formData.alternatePhone
      )
    ) {
      newErrors.alternatePhone =
        "Alternate phone must contain 10 digits.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }

    if (formData.name.length > 400) {
      newErrors.name =
        "Name cannot exceed 400 characters.";
    }

    if (formData.address && formData.address.length > 255) {
      newErrors.address =
        "Address cannot exceed 255 characters.";
    }

    if (formData.city && formData.city.length > 100) {
      newErrors.city =
        "City cannot exceed 100 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validate()) {
      toast.error(
        "Please fix the highlighted fields."
      );

      return;
    }

    try {
      setLoading(true);

      const customer =
        await createCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          alternatePhone:
            formData.alternatePhone?.trim() || undefined,
          email:
            formData.email?.trim() || undefined,
          address:
            formData.address?.trim() || undefined,
          city:
            formData.city?.trim() || undefined,
          notes:
            formData.notes?.trim() || undefined,
          image: profileImage || undefined,
          imagePublicId: profilePublicId || undefined,
          images: postureImages.length > 0 ? postureImages : undefined,
        });

      toast.success(
        "Customer added successfully."
      );

      onSuccess?.(customer);

    } catch (error: any) {
      console.error(
        "Create customer failed:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Failed to create customer.";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      {/* =====================================================
          CUSTOMER PHOTOS & POSTURE
      ====================================================== */}
      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div>
          <h2 className="text-base font-semibold">Customer Photos & Posture (तस्वीर और फिटिंग)</h2>
          <p className="text-xs text-muted-foreground">
            Capture customer's profile photo (1:1) and posture fitting reference photos (3:4) via webcam or file upload.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-5">
          {/* Profile Avatar (1:1) */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Profile Avatar (1:1)</span>
            <div className="relative aspect-square w-24 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/60 p-0.5">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                  <User className="h-8 w-8 stroke-[1.2]" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCameraMode("profile");
                  setCameraModalOpen(true);
                }}
                className="h-7 text-xs gap-1"
              >
                <Camera className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                {profileImage ? "Change" : "Take Photo"}
              </Button>
              {profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProfileImage(null);
                    setProfilePublicId(null);
                  }}
                  className="h-7 px-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Posture / Fitting Photos */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Posture & Fitting Photos ({postureImages.length}/{settings.maxImagesPerCustomer})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={postureImages.length >= settings.maxImagesPerCustomer}
                onClick={() => {
                  setCameraMode("posture");
                  setDefaultPurpose("FRONT_PROFILE");
                  setCameraModalOpen(true);
                }}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Fitting Photo
              </Button>
            </div>

            {postureImages.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                No posture photos added yet. Click &quot;Add Fitting Photo&quot; to capture customer stance.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {postureImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-3/4 w-16 overflow-hidden rounded-lg border bg-muted shadow-xs"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.purpose}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPostureImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[8px] text-white truncate text-center">
                      {img.purpose}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          CUSTOMER INFORMATION
      ====================================================== */}

      <div className="space-y-5">

        <div>
          <h2 className="text-base font-semibold">
            Customer Information
          </h2>

          <p className="text-sm text-muted-foreground">
            Enter the customer's contact and address
            information.
          </p>
        </div>


        {/* =================================================
            NAME + PHONE
        ================================================= */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >

          {/* Name */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name
              <span className="ml-1 text-destructive">
                *
              </span>
            </Label>

            <Input
              id="name"
              value={formData.name}
              onChange={(event) =>
                handleChange(
                  "name",
                  event.target.value
                )
              }
              placeholder="Enter customer name"
              disabled={loading}
              maxLength={400}
              aria-invalid={!!errors.name}
            />

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>


          {/* Phone */}

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number
              <span className="ml-1 text-destructive">
                *
              </span>
            </Label>

            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={(event) =>
                handleChange(
                  "phone",
                  event.target.value.replace(
                    /\D/g,
                    ""
                  ).slice(0, 10)
                )
              }
              placeholder="10 digit phone number"
              disabled={loading}
              maxLength={10}
              aria-invalid={!!errors.phone}
            />

            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone}
              </p>
            )}
          </div>

        </div>


        {/* =================================================
            ALTERNATE PHONE + EMAIL
        ================================================= */}

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >

          {/* Alternate phone */}

          <div className="space-y-2">
            <Label htmlFor="alternatePhone">
              Alternate Phone
            </Label>

            <Input
              id="alternatePhone"
              type="tel"
              inputMode="numeric"
              value={
                formData.alternatePhone
              }
              onChange={(event) =>
                handleChange(
                  "alternatePhone",
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10)
                )
              }
              placeholder="Alternate phone number"
              disabled={loading}
              maxLength={10}
              aria-invalid={
                !!errors.alternatePhone
              }
            />

            {errors.alternatePhone && (
              <p className="text-xs text-destructive">
                {errors.alternatePhone}
              </p>
            )}
          </div>


          {/* Email */}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address
            </Label>

            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                handleChange(
                  "email",
                  event.target.value
                )
              }
              placeholder="customer@example.com"
              disabled={loading}
              maxLength={300}
              aria-invalid={!!errors.email}
            />

            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

        </div>


        {/* =================================================
            ADDRESS
        ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="address">
            Address
          </Label>

          <Textarea
            id="address"
            value={formData.address}
            onChange={(event) =>
              handleChange(
                "address",
                event.target.value
              )
            }
            placeholder="Enter customer's address"
            disabled={loading}
            maxLength={255}
            className="min-h-20 resize-none"
          />

          {errors.address && (
            <p className="text-xs text-destructive">
              {errors.address}
            </p>
          )}
        </div>


        {/* =================================================
            CITY
        ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="city">
            City
          </Label>

          <Input
            id="city"
            value={formData.city}
            onChange={(event) =>
              handleChange(
                "city",
                event.target.value
              )
            }
            placeholder="Enter city"
            disabled={loading}
            maxLength={100}
            aria-invalid={!!errors.city}
          />

          {errors.city && (
            <p className="text-xs text-destructive">
              {errors.city}
            </p>
          )}
        </div>


        {/* =================================================
            NOTES
        ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="notes">
            Notes
          </Label>

          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(event) =>
              handleChange(
                "notes",
                event.target.value
              )
            }
            placeholder="Any additional information about the customer..."
            disabled={loading}
            className="min-h-24 resize-none"
          />
        </div>

      </div>


      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div
        className="
          flex
          flex-col-reverse
          gap-3
          border-t
          pt-6
          sm:flex-row
          sm:justify-end
        "
      >

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>


        <Button
          type="submit"
          disabled={loading}
        >
          {loading && (
            <Loader2
              className="
                mr-2
                size-4
                animate-spin
              "
            />
          )}

          {loading
            ? "Adding Customer..."
            : "Add Customer"}
        </Button>

      </div>

      <CustomerCameraCaptureModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        mode={cameraMode}
        defaultPurpose={defaultPurpose}
        onImageSaved={(result) => {
          if (cameraMode === "profile") {
            setProfileImage(result.imageUrl);
            setProfilePublicId(result.publicId);
          } else {
            setPostureImages((prev) => [...prev, result]);
          }
        }}
      />

    </form>
  );
}