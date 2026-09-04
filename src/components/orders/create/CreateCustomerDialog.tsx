import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { createCustomer } from "@/services/CustomerService";
import type { CustomerResponse } from "@/models/Customer";
import type { CustomerCreateRequest } from "@/models/CustomerCreateRequest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateCustomerDialogProps {
  onCreated: (customer: CustomerResponse) => void;
}

const INITIAL_FORM: CustomerCreateRequest = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

export function CreateCustomerDialog({ onCreated }: CreateCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomerCreateRequest>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof CustomerCreateRequest, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError(null);
  };

  const reset = () => {
    setForm({ ...INITIAL_FORM });
    setError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setError("Customer name is required.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    try {
      setLoading(true);
      const customer = await createCustomer({
        name,
        phone,
        alternatePhone: form.alternatePhone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || undefined,
        city: form.city?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });

      onCreated(customer);
      setOpen(false);
      reset();
    } catch (err) {
      console.error("Failed to create customer:", err);
      setError("Unable to create customer. Please check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create New Customer
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add customer details to continue creating the order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                disabled={loading}
                placeholder="Rahul Dora"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                disabled={loading}
                placeholder="9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label>Alternate Phone</Label>
              <Input
                value={form.alternatePhone || ""}
                onChange={(event) => updateField("alternatePhone", event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(event) => updateField("email", event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city || ""}
                onChange={(event) => updateField("city", event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address || ""}
                onChange={(event) => updateField("address", event.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
