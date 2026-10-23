import { useState, useEffect } from "react";
import { Loader2, UserPlus, Pencil, Gauge, Phone, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/common/ImageUploader";
import { toast } from "react-hot-toast";
import { createWorker, updateWorker } from "@/services/workerService";
import {
  WORKER_SPECIALTIES,
  type Worker,
  type WorkerRequest,
} from "@/types/worker";
import type { UploadedImage } from "@/types/image";

interface WorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWorker?: Worker | null;
  onSaved: () => void;
}

const INITIAL_FORM: WorkerRequest = {
  name: "",
  phone: "",
  alternatePhone: "",
  dailyCapacity: 5,
  workerSpecialty: "STITCHING",
  imageUrl: "",
  imagePublicId: "",
  address: "",
  city: "",
  notes: "",
  active: true,
};

const QUICK_CAPACITIES = [3, 5, 8, 10, 12, 15];

export function WorkerDialog({
  open,
  onOpenChange,
  editingWorker = null,
  onSaved,
}: WorkerDialogProps) {
  const [form, setForm] = useState<WorkerRequest>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingWorker) {
        setForm({
          name: editingWorker.name ?? "",
          phone: editingWorker.phone ?? "",
          alternatePhone: editingWorker.alternatePhone ?? "",
          dailyCapacity: Number(editingWorker.dailyCapacity ?? 5),
          workerSpecialty: editingWorker.workerSpecialty ?? "STITCHING",
          imageUrl: editingWorker.imageUrl ?? "",
          imagePublicId: editingWorker.imagePublicId ?? "",
          address: editingWorker.address ?? "",
          city: editingWorker.city ?? "",
          notes: editingWorker.notes ?? "",
          active: editingWorker.active ?? true,
        });
      } else {
        setForm({ ...INITIAL_FORM });
      }
      setError(null);
    }
  }, [open, editingWorker]);

  const updateField = <K extends keyof WorkerRequest>(
    key: K,
    val: WorkerRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleImageChange = (img: UploadedImage) => {
    setForm((prev) => ({
      ...prev,
      imageUrl: img.imageUrl,
      imagePublicId: img.imagePublicId,
    }));
  };

  const handleImageRemove = () => {
    setForm((prev) => ({
      ...prev,
      imageUrl: "",
      imagePublicId: "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Worker name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Worker phone number is required.");
      return;
    }
    if (!Number.isFinite(form.dailyCapacity) || form.dailyCapacity < 0) {
      setError("Daily capacity must be 0 or greater.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: WorkerRequest = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone?.trim() || "",
        dailyCapacity: Number(form.dailyCapacity),
        workerSpecialty: form.workerSpecialty,
        imageUrl: form.imageUrl?.trim() || "",
        imagePublicId: form.imagePublicId?.trim() || "",
        address: form.address?.trim() || "",
        city: form.city?.trim() || "",
        notes: form.notes?.trim() || "",
        active: form.active,
      };

      if (editingWorker) {
        await updateWorker(editingWorker.id, payload);
        toast.success(`Updated worker "${payload.name}"`);
      } else {
        await createWorker(payload);
        toast.success(`Added worker "${payload.name}" (${payload.dailyCapacity} pcs/day)`);
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error("Failed to save worker:", err);
      setError("Failed to save worker details. Please check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:w-full bg-background text-foreground border-border">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {editingWorker ? (
              <>
                <Pencil className="w-4 h-4 text-primary" />
                Edit Worker & Daily Capacity
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-primary" />
                Add New Worker & Daily Capacity
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Worker Photo Upload */}
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">
              Worker Photo / Profile Image
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload a photo of the tailor or master so low-literacy staff can visually identify them on the floor.
            </p>
            <ImageUploader
              value={{
                imageUrl: form.imageUrl ?? "",
                imagePublicId: form.imagePublicId ?? "",
              }}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
              aspect={1}
              maxSizeMB={5}
              disabled={submitting}
            />
          </div>

          {/* Name & Phone Numbers */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="worker-name" className="font-semibold">
                Worker Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="worker-name"
                placeholder="e.g. Ramesh Master / Gurpreet Singh"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-phone" className="font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                Primary Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="worker-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-alt-phone" className="font-semibold">
                Alternate Phone (Optional)
              </Label>
              <Input
                id="worker-alt-phone"
                type="tel"
                placeholder="e.g. 9123456789"
                value={form.alternatePhone ?? ""}
                onChange={(e) => updateField("alternatePhone", e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Daily Capacity Section */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 dark:bg-primary/10 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <Label htmlFor="worker-capacity" className="font-bold text-sm text-foreground">
                    Daily Production Capacity (Garments / Day)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically added to the Production Calendar's daily shop capacity
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-primary">
                  {form.dailyCapacity}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">
                  pcs/day
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={form.dailyCapacity}
                onChange={(e) => updateField("dailyCapacity", Number(e.target.value))}
                disabled={submitting}
                className="flex-1 accent-primary cursor-pointer"
              />
              <Input
                id="worker-capacity"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.dailyCapacity}
                onChange={(e) =>
                  updateField(
                    "dailyCapacity",
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
                disabled={submitting}
                className="w-24 text-center font-bold bg-background"
              />
            </div>

            {/* Quick Capacity Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Quick set:</span>
              {QUICK_CAPACITIES.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => updateField("dailyCapacity", cap)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    Number(form.dailyCapacity) === cap
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {cap} pcs/day
                </button>
              ))}
            </div>
          </div>

          {/* Worker Specialty / Stage Selector */}
          <div className="space-y-2.5">
            <Label className="font-semibold">
              Primary Production Stage / Specialty
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WORKER_SPECIALTIES.map((spec) => {
                const selected = form.workerSpecialty === spec.value;
                return (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => updateField("workerSpecialty", spec.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? "ring-2 ring-primary border-primary bg-primary/10 text-foreground"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="text-base">{spec.icon}</span>
                    <span className="truncate">{spec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address & Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="worker-address" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Address / Village
              </Label>
              <Input
                id="worker-address"
                placeholder="e.g. Ward 4, Near Gurudwara"
                value={form.address ?? ""}
                onChange={(e) => updateField("address", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-city">City / Town</Label>
              <Input
                id="worker-city"
                placeholder="e.g. Ludhiana"
                value={form.city ?? ""}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="worker-notes" className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Notes / Skill Details (Optional)
              </Label>
              <Input
                id="worker-notes"
                placeholder="e.g. Expert in Kurta Pajama & Safari Suits"
                value={form.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-foreground">Active in Workshop</p>
              <p className="text-xs text-muted-foreground">
                Active workers contribute their daily capacity to the Production Calendar.
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => updateField("active", checked)}
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : editingWorker ? (
              "Save Changes"
            ) : (
              "Add Worker"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
