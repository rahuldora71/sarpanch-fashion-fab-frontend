import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { createCustomer } from "@/services/CustomerService";

import type {
  CustomerCreateRequest,
} from "@/models/CustomerCreateRequest";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CustomerFormProps {
  onSuccess?: (customer: unknown) => void;
  onCancel?: () => void;
}

export default function CustomerForm({
  onSuccess,
  onCancel,
}: CustomerFormProps) {
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

    </form>
  );
}