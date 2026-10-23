import { useEffect, useState } from "react";
import {
  Camera,
  Download,
  Maximize2,
  Settings,
  Trash2,
  User,
  X,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerResponse, CustomerUserImage } from "@/models/Customer";
import {
  addCustomerImage,
  deleteCustomerImage,
  getCustomerImages,
  removeCustomerProfilePicture,
  updateCustomerProfilePicture,
} from "@/services/CustomerService";
import { getCustomerImageSettings } from "@/services/customerSettingsService";
import CustomerCameraCaptureModal, {
  type CapturedImageResult,
  type ImageCaptureMode,
} from "./CustomerCameraCaptureModal";

interface Props {
  customer: CustomerResponse;
  initialImages?: CustomerUserImage[];
  onCustomerUpdated?: (updated: CustomerResponse) => void;
}

const PURPOSE_LABELS: Record<string, string> = {
  PROFILE: "Profile Avatar (1:1)",
  FRONT_PROFILE: "Front Profile (सामने)",
  LEFT_SIDE: "Left Side Profile (बायां)",
  RIGHT_SIDE: "Right Side Profile (दायां)",
  BACK_PROFILE: "Back Profile (पीछे)",
  FULL_BODY: "Full Body (पूरी लंबाई)",
  FITTING_REFERENCE: "Fitting Reference (फिटिंग)",
  OTHER: "Reference / Other",
};

export default function CustomerImageGallery({
  customer,
  initialImages = [],
  onCustomerUpdated,
}: Props) {
  const [images, setImages] = useState<CustomerUserImage[]>(initialImages);
  const [loadingImages, setLoadingImages] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(customer.image || null);

  // Settings
  const [settings, setSettings] = useState(() => getCustomerImageSettings());

  // Camera modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ImageCaptureMode>("posture");
  const [defaultPurpose, setDefaultPurpose] = useState<string>("FRONT_PROFILE");

  // Lightbox modal
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    purpose: string;
    date?: string;
  } | null>(null);

  // Listen for settings change
  useEffect(() => {
    const handleSettingsChanged = () => {
      setSettings(getCustomerImageSettings());
    };
    window.addEventListener("customer-image-settings-changed", handleSettingsChanged);
    return () => {
      window.removeEventListener("customer-image-settings-changed", handleSettingsChanged);
    };
  }, []);

  // Fetch images if not provided initially
  useEffect(() => {
    let cancelled = false;
    if (customer.id && (!initialImages || initialImages.length === 0)) {
      setLoadingImages(true);
      getCustomerImages(customer.id)
        .then((data) => {
          if (!cancelled) setImages(data || []);
        })
        .catch((err) => {
          console.error("Could not fetch customer images:", err);
        })
        .finally(() => {
          if (!cancelled) setLoadingImages(false);
        });
    } else if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
    return () => {
      cancelled = true;
    };
  }, [customer.id, initialImages]);

  // Handle capture completed
  const handleImageSaved = async (result: CapturedImageResult) => {
    if (modalMode === "profile") {
      try {
        const updated = await updateCustomerProfilePicture(customer.id, {
          imageUrl: result.imageUrl,
          publicId: result.publicId,
        });
        setProfileImage(result.imageUrl);
        toast.success("Profile avatar updated successfully!");
        onCustomerUpdated?.(updated);
      } catch (err) {
        console.error("Failed to update profile picture:", err);
        toast.error("Failed to save profile picture to customer profile.");
      }
    } else {
      try {
        const savedImg = await addCustomerImage(customer.id, {
          imageUrl: result.imageUrl,
          publicId: result.publicId,
          purpose: result.purpose,
        });
        setImages((prev) => [savedImg, ...prev]);
        toast.success("Fitting photo added to gallery!");
      } catch (err) {
        console.error("Failed to save fitting image:", err);
        toast.error("Failed to save image to database.");
      }
    }
  };

  // Remove profile picture
  const handleRemoveProfilePicture = async () => {
    if (!confirm("Are you sure you want to remove the customer's profile photo?")) return;
    try {
      const updated = await removeCustomerProfilePicture(customer.id);
      setProfileImage(null);
      toast.success("Profile photo removed.");
      onCustomerUpdated?.(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove profile photo.");
    }
  };

  // Delete posture photo
  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this fitting photo?")) return;
    try {
      await deleteCustomerImage(customer.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Photo deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete photo.");
    }
  };

  const openProfileCamera = () => {
    setModalMode("profile");
    setModalOpen(true);
  };

  const openPostureCamera = (purpose = "FRONT_PROFILE") => {
    if (images.length >= settings.maxImagesPerCustomer) {
      toast.error(
        `Customer has reached the limit of ${settings.maxImagesPerCustomer} posture photos. You can increase this in Settings.`
      );
      return;
    }
    setModalMode("posture");
    setDefaultPurpose(purpose);
    setModalOpen(true);
  };

  const maxReached = images.length >= settings.maxImagesPerCustomer;

  return (
    <div className="space-y-6">
      {/* SECTION 1: PROFILE PICTURE & POSTURE STATUS BANNER */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Avatar Card (Square 1:1) */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Profile Photo (1:1)</CardTitle>
            <CardDescription className="text-xs">
              Primary avatar used on orders and profile
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="relative aspect-square w-36 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-1 shadow-sm">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={customer.name}
                  className="h-full w-full rounded-xl object-cover cursor-pointer transition hover:opacity-90"
                  onClick={() =>
                    setLightboxImage({
                      url: profileImage,
                      purpose: "PROFILE",
                    })
                  }
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                  <User className="h-12 w-12 stroke-[1.2]" />
                  <span className="mt-1 text-[11px]">No Photo</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openProfileCamera}
                className="gap-1.5 text-xs font-medium"
              >
                <Camera className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                {profileImage ? "Change Photo" : "Capture Photo"}
              </Button>
              {profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveProfilePicture}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posture / Fitting Info & Controls Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Body Posture & Fitting References (3:4)
                </CardTitle>
                <CardDescription className="text-xs">
                  Helps tailors inspect customer shoulder slope, chest arch, and belly stance during
                  cutting & stitching
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={maxReached ? "destructive" : "secondary"} className="text-xs">
                  {images.length} / {settings.maxImagesPerCustomer} Photos
                </Badge>
                <Link
                  to="/settings?tab=customer_photos"
                  className="rounded-md border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Configure max photos limit in Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => openPostureCamera("FRONT_PROFILE")}
                disabled={maxReached}
                className="gap-1.5 bg-orange-600 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
              >
                <Camera className="h-3.5 w-3.5" />
                Snap Fitting Photo (कैमरा खोलें)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPostureCamera("LEFT_SIDE")}
                disabled={maxReached}
                className="text-xs"
              >
                + Side Profile (साइड)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPostureCamera("BACK_PROFILE")}
                disabled={maxReached}
                className="text-xs"
              >
                + Back Profile (पीछे)
              </Button>
            </div>

            {maxReached && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Maximum photo limit reached ({settings.maxImagesPerCustomer} photos). Delete an old
                  photo or increase limit in{" "}
                  <Link
                    to="/settings?tab=customer_photos"
                    className="font-semibold underline underline-offset-2"
                  >
                    Settings
                  </Link>
                  .
                </span>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground">
              Tip: Photos captured here are automatically available to tailors during Order Creation
              and Measurement entry.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: GALLERY GRID OF POSTURE PHOTOS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Customer Photo Gallery</CardTitle>
          <CardDescription className="text-xs">
            All stored fitting, stance, and posture reference photos for {customer.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingImages ? (
            <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
              Loading customer gallery photos...
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <div className="mb-2 rounded-full bg-muted p-3 text-muted-foreground">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No posture photos uploaded yet</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Capture the customer's front and side profile postures so your master tailor can craft
                the perfect fit.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPostureCamera("FRONT_PROFILE")}
                className="mt-4 gap-1.5 text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                Capture First Fitting Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {images.map((img) => {
                const label = PURPOSE_LABELS[img.purpose] || img.purpose || "Posture";
                const dateStr = img.createdAt
                  ? new Date(img.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "";

                return (
                  <div
                    key={img.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:shadow-md"
                  >
                    {/* Image Thumbnail with 3:4 or ratio */}
                    <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                      <img
                        src={img.imageUrl}
                        alt={label}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      {/* Overlay action buttons */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={() =>
                            setLightboxImage({
                              url: img.imageUrl,
                              purpose: img.purpose,
                              date: dateStr,
                            })
                          }
                          title="View Fullscreen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={() => handleDeleteImage(img.id)}
                          title="Delete Photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2.5">
                      <p className="truncate text-xs font-semibold text-foreground" title={label}>
                        {label}
                      </p>
                      {dateStr && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{dateStr}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAMERA CAPTURE / UPLOAD MODAL */}
      <CustomerCameraCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        defaultPurpose={defaultPurpose}
        onImageSaved={handleImageSaved}
      />

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-white">
              <div>
                <span className="text-sm font-semibold">
                  {PURPOSE_LABELS[lightboxImage.purpose] || lightboxImage.purpose}
                </span>
                {lightboxImage.date && (
                  <span className="ml-2 text-xs text-slate-400">({lightboxImage.date})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                  title="Open Full Image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview */}
            <div className="flex max-h-[82vh] items-center justify-center p-2">
              <img
                src={lightboxImage.url}
                alt="Posture Reference"
                className="max-h-[80vh] max-w-[88vw] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
