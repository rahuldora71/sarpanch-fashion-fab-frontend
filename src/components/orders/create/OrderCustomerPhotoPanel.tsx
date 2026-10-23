import { useEffect, useState } from "react";
import {
  Camera,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import CustomerAvatar from "@/components/customers/CustomerAvatar";
import CustomerCameraCaptureModal, {
  type CapturedImageResult,
} from "@/components/customers/CustomerCameraCaptureModal";
import type { CustomerSummary, CustomerUserImage } from "@/models/Customer";
import {
  addCustomerImage,
  getCustomerImages,
} from "@/services/CustomerService";
import { getCustomerImageSettings } from "@/services/customerSettingsService";

interface Props {
  customer: CustomerSummary;
  compact?: boolean;
}

const PURPOSE_LABELS: Record<string, string> = {
  FRONT_PROFILE: "Front",
  LEFT_SIDE: "Left Side",
  RIGHT_SIDE: "Right Side",
  BACK_PROFILE: "Back",
  FULL_BODY: "Full Body",
  FITTING_REFERENCE: "Fitting",
  OTHER: "Reference",
};

export default function OrderCustomerPhotoPanel({
  customer,
  compact = false,
}: Props) {
  const settings = getCustomerImageSettings();
  const [images, setImages] = useState<CustomerUserImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (customer?.id) {
      setLoading(true);
      setImages([]);
      getCustomerImages(customer.id)
        .then((data) => {
          if (!cancelled) setImages(data || []);
        })
        .catch((err) => {
          console.error("Could not fetch order customer photos:", err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setImages([]);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [customer?.id]);

  const handlePhotoCaptured = async (result: CapturedImageResult) => {
    try {
      const saved = await addCustomerImage(customer.id, {
        imageUrl: result.imageUrl,
        publicId: result.publicId,
        purpose: result.purpose,
      });
      setImages((prev) => [saved, ...prev]);
      toast.success("Fitting photo added to customer profile!");
    } catch (err) {
      console.error("Failed to link photo:", err);
      toast.error("Failed to save fitting photo.");
    }
  };

  const handleOpenSnap = () => {
    if (images.length >= settings.maxImagesPerCustomer) {
      toast.error(
        `Customer already has ${images.length} photos (Limit: ${settings.maxImagesPerCustomer}). Manage in Settings.`
      );
      return;
    }
    setCameraOpen(true);
  };

  return (
    <div className="rounded-xl border border-orange-200/80 bg-orange-50/40 p-3.5 dark:border-orange-950/40 dark:bg-orange-950/15">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CustomerAvatar
            name={customer.name}
            image={customer.image}
            size={compact ? "sm" : "md"}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{customer.name}</span>
              {customer.customerCode && (
                <span className="font-mono text-[11px] text-orange-700 dark:text-orange-400">
                  {customer.customerCode}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {customer.phone || "No phone"} · {loading ? "Loading photos..." : `${images.length} fitting photo${images.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenSnap}
            className="h-8 gap-1.5 bg-background text-xs font-medium shadow-xs"
          >
            <Camera className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span className="hidden sm:inline">Snap Fitting</span>
          </Button>

          {compact && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Photos Strip */}
      {expanded && (
        <div className="mt-3 border-t border-orange-200/60 pt-3 dark:border-orange-950/40">
          {loading ? (
            <div className="py-2 text-xs text-muted-foreground">Loading photos...</div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-between rounded-lg bg-background/80 p-2 text-xs text-muted-foreground">
              <span>No posture photos on file for {customer.name}.</span>
              <button
                type="button"
                onClick={handleOpenSnap}
                className="font-medium text-orange-600 hover:underline dark:text-orange-400"
              >
                + Snap Front/Side Photo
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {/* Profile Avatar if present */}
              {customer.image && (
                <div
                  className="group relative aspect-square w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-orange-300 bg-muted shadow-xs transition hover:opacity-90"
                  onClick={() => setLightboxUrl(customer.image!)}
                  title="Profile Photo (1:1)"
                >
                  <img
                    src={customer.image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center text-[8px] font-medium text-white">
                    Avatar
                  </div>
                </div>
              )}

              {/* Posture / Fitting Photos (3:4) */}
              {images.map((img) => {
                const label = PURPOSE_LABELS[img.purpose] || img.purpose || "Pose";
                return (
                  <div
                    key={img.id}
                    className="group relative aspect-3/4 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-muted shadow-xs transition hover:scale-105"
                    onClick={() => setLightboxUrl(img.imageUrl)}
                    title={`Click to view ${label} stance`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={label}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center text-[8px] font-medium text-white truncate px-0.5">
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CustomerCameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        mode="posture"
        defaultPurpose="FRONT_PROFILE"
        onImageSaved={handlePhotoCaptured}
      />

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-black p-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightboxUrl}
              alt="Fitting Fullscreen"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
