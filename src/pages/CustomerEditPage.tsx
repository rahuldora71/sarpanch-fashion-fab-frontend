import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Camera, Loader2, Trash2, User } from "lucide-react";

import { getCustomerById, updateCustomer } from "@/services/CustomerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CustomerCameraCaptureModal from "@/components/customers/CustomerCameraCaptureModal";

interface FormState {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  image?: string | null;
  imagePublicId?: string | null;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  image: null,
  imagePublicId: null,
};

export default function CustomerEditPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  useEffect(() => {
    const id = Number(customerId);
    if (!Number.isFinite(id)) {
      navigate("/customers", { replace: true });
      return;
    }

    getCustomerById(id)
      .then((customer) => {
        setForm({
          name: customer.name ?? "",
          phone: customer.phone ?? "",
          alternatePhone: customer.alternatePhone ?? "",
          email: customer.email ?? "",
          address: customer.address ?? "",
          city: customer.city ?? "",
          notes: customer.notes ?? "",
          image: customer.image ?? null,
          imagePublicId: customer.imagePublicId ?? null,
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load customer.");
        navigate(`/customers/${id}`, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [customerId, navigate]);

  const setField = (key: keyof FormState, value: string | null) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    const id = Number(customerId);
    if (!form.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      toast.error("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      setSaving(true);
      await updateCustomer(id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        notes: form.notes.trim() || undefined,
        image: form.image || undefined,
        imagePublicId: form.imagePublicId || undefined,
      });
      toast.success("Customer updated successfully.");
      navigate(`/customers/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading customer…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button
        type="button"
        onClick={() => navigate(`/customers/${customerId}`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customer
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Customer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update customer photo, contact, and address details.
        </p>
      </div>

      {/* PROFILE PHOTO CARD */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Customer Profile Photo</CardTitle>
          <CardDescription className="text-xs">
            Square (1:1) avatar captured via live webcam or file upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-1 shadow-xs">
              {form.image ? (
                <img
                  src={form.image}
                  alt={form.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <User className="h-10 w-10 stroke-[1.2]" />
                  <span className="mt-1 text-[10px]">No Photo</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCameraModalOpen(true)}
                  className="gap-1.5 text-xs font-medium"
                >
                  <Camera className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  {form.image ? "Change Photo (Camera/Upload)" : "Take Photo with Camera"}
                </Button>
                {form.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setField("image", null);
                      setField("imagePublicId", null);
                    }}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click above to open the live camera directly in your browser.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER DETAILS FORM */}
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Name *</span>
            <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Phone *</span>
            <Input
              maxLength={10}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Alternate Phone</span>
            <Input
              maxLength={10}
              value={form.alternatePhone}
              onChange={(e) => setField("alternatePhone", e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium">Address</span>
            <Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">City</span>
            <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/customers/${customerId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CAMERA MODAL */}
      <CustomerCameraCaptureModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        mode="profile"
        onImageSaved={(result) => {
          setField("image", result.imageUrl);
          setField("imagePublicId", result.publicId);
        }}
      />
    </div>
  );
}
