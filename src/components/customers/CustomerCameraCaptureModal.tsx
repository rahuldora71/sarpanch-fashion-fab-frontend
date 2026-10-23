import { useCallback, useEffect, useRef, useState } from "react";

import Cropper, { type Area } from "react-easy-crop";

import {
  Camera,
  CameraOff,
  Check,
  FolderOpen,
  Loader2,
  Lock,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  SwitchCamera,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Slider } from "@/components/ui/slider";

import { getCustomerImageSettings } from "@/services/customerSettingsService";

import { uploadImage } from "@/services/imageService";

import getCroppedImg from "@/utils/cropImage";

export type ImageCaptureMode = "profile" | "posture";

export interface CapturedImageResult {

  imageUrl: string;

  publicId: string;

  purpose: string;

}

interface Props {

  open: boolean;

  onClose: () => void;

  mode: ImageCaptureMode;

  defaultPurpose?: string;

  onImageSaved: (result: CapturedImageResult) => void;

}

const PURPOSE_OPTIONS = [

  { value: "FRONT_PROFILE", label: "Front Profile (सामने से)" },

  { value: "LEFT_SIDE", label: "Left Side Profile (बायां साइड)" },

  { value: "RIGHT_SIDE", label: "Right Side Profile (दायां साइड)" },

  { value: "BACK_PROFILE", label: "Back Profile (पीछे से)" },

  { value: "FULL_BODY", label: "Full Body Fitting (पूरी लंबाई)" },

  { value: "FITTING_REFERENCE", label: "Fitting Reference (फिटिंग)" },

  { value: "OTHER", label: "Other / Reference (अन्य)" },

];

export default function CustomerCameraCaptureModal({

  open,

  onClose,

  mode,

  defaultPurpose = "FRONT_PROFILE",

  onImageSaved,

}: Props) {

  const settings = getCustomerImageSettings();

  // Active view tab: "camera" or "upload"

  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraErrorType, setCameraErrorType] = useState<
    "insecure" | "permission" | "not_found" | "not_readable" | "unsupported" | "generic" | null
  >(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    settings.defaultCameraFacingMode
  );

  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const [countdown, setCountdown] = useState<number | null>(null);

  const [isFlashing, setIsFlashing] = useState(false);

  // Cropping & Review State

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [rotation, setRotation] = useState(0);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [uploading, setUploading] = useState(false);

  // Aspect ratio state

  const defaultAspect =

    mode === "profile"

      ? 1

      : settings.preferredPostureRatio === "16:9"

      ? 16 / 9

      : settings.preferredPostureRatio === "1:1"

      ? 1

      : 3 / 4;

  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspect);

  // Purpose tag

  const [selectedPurpose, setSelectedPurpose] = useState<string>(

    mode === "profile" ? "PROFILE" : defaultPurpose

  );

  // File drag state

  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when modal opens

  useEffect(() => {

    if (open) {

      setImageSrc(null);

      setZoom(1);

      setRotation(0);

      setCrop({ x: 0, y: 0 });

      setCountdown(null);

      setSelectedPurpose(mode === "profile" ? "PROFILE" : defaultPurpose);

      setAspectRatio(

        mode === "profile"

          ? 1

          : settings.preferredPostureRatio === "16:9"

          ? 16 / 9

          : settings.preferredPostureRatio === "1:1"

          ? 1

          : 3 / 4

      );

      setActiveTab("camera");

    }

  }, [open, mode, defaultPurpose, settings.preferredPostureRatio]);

  // Load available camera devices

  const refreshDevices = useCallback(async () => {

    try {

      if (!navigator.mediaDevices?.enumerateDevices) return;

      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      setAvailableDevices(videoInputs);

      if (videoInputs.length > 0 && !selectedDeviceId) {

        setSelectedDeviceId(videoInputs[0].deviceId);

      }

    } catch (err) {

      console.warn("Could not list video devices:", err);

    }

  }, [selectedDeviceId]);

  // Start Camera Stream with proper environment diagnosis
  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setCameraError(null);
      setCameraErrorType(null);

      // Clean up previous stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // 1. Insecure Context Check (HTTP LAN IP scenario)
      // Browsers disable navigator.mediaDevices on insecure origins
      if (typeof window !== "undefined" && window.isSecureContext === false) {
        setCameraErrorType("insecure");
        setCameraError(
          `Live camera streaming is blocked by browser security on insecure HTTP (${window.location.host}). Browsers require HTTPS or localhost for live webcam streaming.`
        );
        return;
      }

      // 2. Hardware / Browser MediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraErrorType("unsupported");
        setCameraError(
          "Direct camera streaming is not supported on this browser or webview."
        );
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: unknown) {
        const cErr = constraintErr as { name?: string };
        // Fallback to basic video constraint if ideal resolution / facing mode fails
        if (cErr.name === "OverconstrainedError") {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw constraintErr;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      refreshDevices();
    } catch (err: unknown) {
      console.error("Error accessing camera:", err);
      const e = err as { name?: string; message?: string };

      if (
        e.name === "NotAllowedError" ||
        e.name === "PermissionDeniedError"
      ) {
        setCameraErrorType("permission");
        setCameraError(
          "Camera permission was denied. Please allow camera access in browser site settings and click Retry Camera."
        );
      } else if (
        e.name === "NotFoundError" ||
        e.name === "DevicesNotFoundError"
      ) {
        setCameraErrorType("not_found");
        setCameraError(
          "No camera hardware detected on this device. Connect a webcam or capture via phone."
        );
      } else if (
        e.name === "NotReadableError" ||
        e.name === "TrackStartError"
      ) {
        setCameraErrorType("not_readable");
        setCameraError(
          "Camera is already in use by another application or browser tab. Please close any other app using the camera and retry."
        );
      } else {
        setCameraErrorType("generic");
        setCameraError(
          "Could not access camera: " + (e.message || "Unknown error")
        );
      }
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, selectedDeviceId, refreshDevices]);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleMobileCaptureClick = () => {
    mobileCameraInputRef.current?.click();
  };

  const handleMobileFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChosen(file);
    }
    e.target.value = "";
  };

  // Handle open/close & tab change

  useEffect(() => {
    let cancelled = false;

    if (open && activeTab === "camera" && !imageSrc) {
      const timer = setTimeout(() => {
        if (!cancelled) {
          void startCamera();
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      const timer = setTimeout(() => {
        if (!cancelled) stopCamera();
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        stopCamera();
      };
    }
  }, [open, activeTab, imageSrc, facingMode, selectedDeviceId, startCamera, stopCamera]);

  // Switch camera facing mode

  const handleToggleFacingMode = () => {

    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

    setSelectedDeviceId(""); // clear exact device id to allow facingMode switch

  };

  // Capture photo from live video element

  const takeSnapshot = () => {

    if (!videoRef.current) return;

    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {

      toast.error("Camera is still warming up. Please wait a second.");

      return;

    }

    // Flash effect

    setIsFlashing(true);

    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // If front camera, mirror image for natural reflection

    if (facingMode === "user") {

      ctx.translate(canvas.width, 0);

      ctx.scale(-1, 1);

    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    stopCamera();

    setImageSrc(dataUrl);

    setZoom(1);

    setRotation(0);

  };

  // Start countdown or instant snap

  const handleSnapClick = () => {

    if (settings.enableCountdown) {

      setCountdown(3);

      const timer = setInterval(() => {

        setCountdown((curr) => {

          if (curr === null || curr <= 1) {

            clearInterval(timer);

            takeSnapshot();

            return null;

          }

          return curr - 1;

        });

      }, 1000);

    } else {

      takeSnapshot();

    }

  };

  // Handle file select / drag & drop

  const handleFileChosen = (file: File) => {

    if (!file.type.startsWith("image/")) {

      toast.error("Please select a valid image file (JPG, PNG, WebP).");

      return;

    }

    const reader = new FileReader();

    reader.onload = () => {

      stopCamera();

      setImageSrc(reader.result as string);

      setZoom(1);

      setRotation(0);

    };

    reader.readAsDataURL(file);

  };

  const handleDrop = (e: React.DragEvent) => {

    e.preventDefault();

    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {

      handleFileChosen(e.dataTransfer.files[0]);

    }

  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {

    setCroppedAreaPixels(croppedAreaPixels);

  }, []);

  // Save / Upload cropped image

  const handleUploadAndSave = async () => {

    if (!imageSrc || !croppedAreaPixels) {

      toast.error("Please crop the image before saving.");

      return;

    }

    try {

      setUploading(true);

      const fileName = `${mode === "profile" ? "customer-avatar" : "customer-posture"}-${Date.now()}.jpg`;

      const croppedFile = await getCroppedImg(

        imageSrc,

        croppedAreaPixels,

        rotation,

        fileName

      );

      const res = await uploadImage(croppedFile);

      if (!res.imageUrl) {

        throw new Error("Upload did not return an image URL");

      }

      toast.success(

        mode === "profile"

          ? "Profile picture captured successfully!"

          : "Fitting photo captured and uploaded!"

      );

      onImageSaved({

        imageUrl: res.imageUrl,

        publicId: res.publicId || "",

        purpose: mode === "profile" ? "PROFILE" : selectedPurpose,

      });

      onClose();

    } catch (err: any) {

      console.error("Failed to crop/upload image:", err);

      toast.error(err?.message || "Failed to upload image. Please try again.");

    } finally {

      setUploading(false);

    }

  };

  // Retake / pick new

  const handleRetake = () => {

    setImageSrc(null);

    setCrop({ x: 0, y: 0 });

    setZoom(1);

    setRotation(0);

    if (activeTab === "camera") {

      startCamera();

    }

  };

  return (

    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>

      <DialogContent className="flex max-h-[94dvh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">

        <DialogHeader className="shrink-0 border-b bg-background px-4 py-4 sm:px-6">

          <div className="flex items-center justify-between">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 ring-1 ring-orange-200/70 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900">

                <Camera className="h-5 w-5" />

              </div>

              <div>

                <DialogTitle className="text-base font-semibold tracking-tight sm:text-lg">

                  {mode === "profile"

                    ? "Capture Profile Photo (1:1 Avatar)"

                    : "Capture Customer Posture & Fitting Photo"}

                </DialogTitle>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">

                  {mode === "profile"

                    ? "Direct webcam capture or upload for customer profile"

                    : "Front, side, and posture fitting photos for tailoring reference"}

                </p>

              </div>

            </div>

          </div>

        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Top Switcher: Live Camera vs File Upload */}

          {!imageSrc && (

            <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex w-full rounded-xl bg-muted p-1 sm:w-auto">

                <button

                  type="button"

                  onClick={() => setActiveTab("camera")}

                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all sm:flex-none ${

                    activeTab === "camera"

                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"

                      : "text-muted-foreground hover:text-foreground"

                  }`}

                >

                  <Camera className="h-3.5 w-3.5" />

                  Camera

                </button>

                <button

                  type="button"

                  onClick={() => setActiveTab("upload")}

                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all sm:flex-none ${

                    activeTab === "upload"

                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"

                      : "text-muted-foreground hover:text-foreground"

                  }`}

                >

                  <FolderOpen className="h-3.5 w-3.5" />

                  Upload photo

                </button>

              </div>

              {/* Camera Switch / Devices */}

              {activeTab === "camera" && availableDevices.length > 0 && (

                <div className="flex items-center gap-1.5">

                  <Button

                    type="button"

                    variant="outline"

                    size="sm"

                    className="h-8 gap-1 text-xs"

                    onClick={handleToggleFacingMode}

                    title="Flip camera (Front / Rear)"

                  >

                    <SwitchCamera className="h-3.5 w-3.5" />

                    <span className="hidden sm:inline">

                      {facingMode === "environment" ? "Back Lens" : "Front Lens"}

                    </span>

                  </Button>

                </div>

              )}

            </div>

          )}

          {/* VIEW 1: LIVE CAMERA STREAM */}

          {!imageSrc && activeTab === "camera" && (

            <div className="space-y-4">

              <div className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-neutral-950 shadow-inner sm:aspect-video">

                {/* Hidden native camera capture input (works on mobile even over HTTP LAN!) */}
                <input
                  ref={mobileCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture={facingMode === "user" ? "user" : "environment"}
                  className="hidden"
                  onChange={handleMobileFileInputChange}
                />

                {cameraError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <div
                      className={`mb-3 rounded-full p-3.5 ${
                        cameraErrorType === "insecure"
                          ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                          : cameraErrorType === "permission"
                          ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                          : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
                      }`}
                    >
                      {cameraErrorType === "insecure" ? (
                        <ShieldAlert className="h-8 w-8" />
                      ) : cameraErrorType === "permission" ? (
                        <Lock className="h-8 w-8" />
                      ) : cameraErrorType === "not_found" ? (
                        <CameraOff className="h-8 w-8" />
                      ) : (
                        <Camera className="h-8 w-8" />
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-foreground">
                      {cameraErrorType === "insecure"
                        ? "HTTPS / Secure Origin Required for Live Stream"
                        : cameraErrorType === "permission"
                        ? "Camera Permission Required"
                        : cameraErrorType === "not_found"
                        ? "No Camera Hardware Detected"
                        : cameraErrorType === "not_readable"
                        ? "Camera In Use Elsewhere"
                        : "Camera Unavailable"}
                    </h4>

                    <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                      {cameraError}
                    </p>

                    {cameraErrorType === "insecure" && (
                      <div className="mt-3 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[11px] text-amber-700 dark:text-amber-300">
                        <span className="font-semibold">Tip for Phones & Tablets:</span> Tap{" "}
                        <strong>&ldquo;Take Photo with Device Camera&rdquo;</strong> below. Mobile browsers allow direct camera capture through the file picker even over local Wi-Fi!
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleMobileCaptureClick}
                        className="gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Take Photo with Device Camera
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={startCamera}
                        disabled={isInitializing}
                        className="gap-1.5 text-xs"
                      >
                        {isInitializing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Retry Camera
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("upload")}
                        className="gap-1.5 text-xs"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Upload from Computer Instead
                      </Button>
                    </div>
                  </div>
                ) : isInitializing ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-6 text-center text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-xs font-medium">Starting camera stream...</p>
                  </div>
                ) : (

                  <>

                    <video

                      ref={videoRef}

                      playsInline

                      muted

                      autoPlay

                      className={`h-full w-full object-cover transition-opacity ${

                        facingMode === "user" ? "-scale-x-100" : ""

                      }`}

                    />

                    {/* Framing Guidelines Overlay */}

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                      {mode === "profile" ? (

                        <div className="aspect-square w-52 sm:w-64 rounded-full border-2 border-dashed border-orange-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">

                          <div className="flex h-full w-full items-center justify-center">

                            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">

                              Profile Face Guide

                            </span>

                          </div>

                        </div>

                      ) : (

                        <div

                          className={`border-2 border-dashed border-orange-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ${
                            aspectRatio === 16 / 9
                              ? "aspect-video w-[88%] max-h-[78%]"
                              : aspectRatio === 1
                              ? "aspect-square h-[78%] max-w-[78%]"
                              : "aspect-[3/4] h-[92%] max-w-[72%]"
                          } flex flex-col justify-between p-2 sm:p-3`}
                        >
                          <div className="flex items-start justify-between gap-2 text-[10px] leading-tight text-white/85 sm:text-xs">
                            <span className="max-w-[70%]">Tailor Posture Frame</span>
                            <span className="shrink-0">
                              {aspectRatio === 16 / 9
                                ? "16:9 Wide"
                                : aspectRatio === 1
                                ? "1:1 Square"
                                : "3:4 Fit"}
                            </span>
                          </div>

                          <div className="border-t border-dashed border-white/40" />

                          <div className="text-center text-[10px] text-white/70">

                            Align customer stance within frame

                          </div>

                        </div>

                      )}

                    </div>

                    {/* Shutter Flash Animation */}

                    {isFlashing && (

                      <div className="absolute inset-0 bg-white opacity-90 transition-opacity duration-200" />

                    )}

                    {/* Countdown Overlay */}

                    {countdown !== null && (

                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">

                        <span className="animate-ping text-7xl font-extrabold text-orange-400 drop-shadow-lg">

                          {countdown}

                        </span>

                      </div>

                    )}

                  </>

                )}

              </div>

              {/* Camera Controls Footer */}

              {!cameraError && (

                <div className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-4">

                  <div className="min-w-0">

                    {mode !== "profile" && (

                      <div className="flex min-w-0 flex-col gap-1.5">

                        <Label className="text-xs font-medium text-muted-foreground">Photo pose</Label>

                        <select

                          value={selectedPurpose}

                          onChange={(e) => setSelectedPurpose(e.target.value)}

                          className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-orange-500/30"

                        >

                          {PURPOSE_OPTIONS.map((opt) => (

                            <option key={opt.value} value={opt.value}>

                              {opt.label}

                            </option>

                          ))}

                        </select>

                      </div>

                    )}

                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-auto">

                    <Button

                      type="button"

                      size="lg"

                      onClick={handleSnapClick}

                      disabled={countdown !== null || !stream}

                      className="h-11 w-full gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"

                    >

                      <Camera className="h-5 w-5 shrink-0" />

                      <span>{countdown !== null ? `Capturing in ${countdown}…` : "Take Photo (फोटो खींचें)"}</span>

                    </Button>

                  </div>

                </div>

              )}

            </div>

          )}

          {/* VIEW 2: FILE UPLOAD DROPZONE */}

          {!imageSrc && activeTab === "upload" && (

            <div className="space-y-4">

              <div

                onDragOver={(e) => {

                  e.preventDefault();

                  setIsDragging(true);

                }}

                onDragLeave={() => setIsDragging(false)}

                onDrop={handleDrop}

                onClick={() => fileInputRef.current?.click()}

                className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:min-h-80 ${

                  isDragging

                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"

                    : "border-muted-foreground/30 hover:border-orange-500/60 hover:bg-muted/40"

                }`}

              >

                <div className="mb-4 rounded-2xl bg-orange-100 p-4 text-orange-700 ring-1 ring-orange-200/70 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-900">

                  <UploadCloud className="h-8 w-8" />

                </div>

                <p className="text-sm font-semibold">Drop a photo here, or click to browse</p>

                <p className="mt-1 text-xs text-muted-foreground">

                  JPG, PNG or WebP · Use a clear, well-lit photo

                </p>

                <Button type="button" variant="outline" size="sm" className="pointer-events-none mt-4 gap-1.5 text-xs">

                  <FolderOpen className="h-3.5 w-3.5" />

                  Browse Files

                </Button>

                <input

                  ref={fileInputRef}

                  type="file"

                  accept="image/*"

                  className="hidden"

                  onChange={(e) => {

                    if (e.target.files && e.target.files[0]) {
                      handleFileChosen(e.target.files[0]);
                    }
                    e.currentTarget.value = "";
                  }}

                />

              </div>

              {mode !== "profile" && (

                <div className="flex items-center gap-2">

                  <Label className="text-xs text-muted-foreground">Tag Photo Purpose:</Label>

                  <select

                    value={selectedPurpose}

                    onChange={(e) => setSelectedPurpose(e.target.value)}

                    className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-orange-500/40 sm:h-9 sm:w-auto sm:max-w-[320px] sm:text-xs"

                  >

                    {PURPOSE_OPTIONS.map((opt) => (

                      <option key={opt.value} value={opt.value}>

                        {opt.label}

                      </option>

                    ))}

                  </select>

                </div>

              )}

            </div>

          )}

          {/* VIEW 3: CROP & ADJUST VIEW (react-easy-crop) */}

          {imageSrc && (

            <div className="space-y-4">

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-neutral-950 shadow-inner sm:aspect-video">

                <Cropper

                  image={imageSrc}

                  crop={crop}

                  zoom={zoom}

                  rotation={rotation}

                  aspect={aspectRatio}

                  cropShape={mode === "profile" && aspectRatio === 1 ? "round" : "rect"}

                  showGrid={true}

                  onCropChange={setCrop}

                  onCropComplete={onCropComplete}

                  onZoomChange={setZoom}

                  onRotationChange={setRotation}

                />

              </div>

              {/* Cropping & Aspect Controls */}

              <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">

                  {/* Zoom Slider */}

                  <div className="flex items-center gap-2 min-w-[180px]">

                    <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />

                    <Slider

                      value={[zoom]}

                      min={1}

                      max={3}

                      step={0.1}

                      onValueChange={(val: any) => {

                        if (Array.isArray(val)) {

                          setZoom(val[0]);

                        } else if (typeof val === "number") {

                          setZoom(val);

                        }

                      }}

                      className="w-24 sm:w-32"

                    />

                    <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />

                    <span className="font-mono text-[11px] text-muted-foreground">

                      {zoom.toFixed(1)}x

                    </span>

                  </div>

                  {/* Rotate */}

                  <div className="flex items-center gap-1.5">

                    <Button

                      type="button"

                      variant="outline"

                      size="sm"

                      className="h-7 px-2 text-xs gap-1"

                      onClick={() => setRotation((r) => (r + 90) % 360)}

                    >

                      <RotateCw className="h-3 w-3" />

                      Rotate 90°

                    </Button>

                  </div>

                  {/* Aspect Ratio Switcher (if posture mode) */}

                  {mode !== "profile" && (

                    <div className="flex items-center gap-1 bg-background rounded-md border p-0.5">

                      <button

                        type="button"

                        onClick={() => setAspectRatio(3 / 4)}

                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${

                          aspectRatio === 3 / 4

                            ? "bg-orange-600 text-white"

                            : "text-muted-foreground hover:text-foreground"

                        }`}

                      >

                        3:4 (Portrait)

                      </button>

                      <button

                        type="button"

                        onClick={() => setAspectRatio(1)}

                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${

                          aspectRatio === 1

                            ? "bg-orange-600 text-white"

                            : "text-muted-foreground hover:text-foreground"

                        }`}

                      >

                        1:1 (Square)

                      </button>

                      <button

                        type="button"

                        onClick={() => setAspectRatio(16 / 9)}

                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${

                          aspectRatio === 16 / 9

                            ? "bg-orange-600 text-white"

                            : "text-muted-foreground hover:text-foreground"

                        }`}

                      >

                        16:9 (Wide)

                      </button>

                    </div>

                  )}

                </div>

                {/* Purpose Selection for Posture Photos */}

                {mode !== "profile" && (

                  <div className="flex items-center gap-2 border-t pt-2">

                    <Label className="text-xs text-muted-foreground font-medium shrink-0">

                      Photo Category:

                    </Label>

                    <select

                      value={selectedPurpose}

                      onChange={(e) => setSelectedPurpose(e.target.value)}

                      className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"

                    >

                      {PURPOSE_OPTIONS.map((opt) => (

                        <option key={opt.value} value={opt.value}>

                          {opt.label}

                        </option>

                      ))}

                    </select>

                  </div>

                )}

              </div>

              {/* Action Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">

                <Button

                  type="button"

                  variant="outline"

                  onClick={handleRetake}

                  disabled={uploading}

                  className="gap-1.5 text-xs"

                >

                  <RefreshCw className="h-3.5 w-3.5" />

                  Retake / Choose Another

                </Button>

                <div className="flex items-center gap-2">

                  <Button

                    type="button"

                    variant="ghost"

                    onClick={onClose}

                    disabled={uploading}

                    className="text-xs"

                  >

                    Cancel

                  </Button>

                  <Button

                    type="button"

                    onClick={handleUploadAndSave}

                    disabled={uploading || !imageSrc || !croppedAreaPixels}

                    className="gap-2 bg-orange-600 font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60 sm:min-w-36"

                  >

                    {uploading ? (

                      <>

                        <Loader2 className="h-4 w-4 animate-spin" />

                        Uploading to Cloud...

                      </>

                    ) : (

                      <>

                        <Check className="h-4 w-4" />

                        Save Photo (सेव करें)

                      </>

                    )}

                  </Button>

                </div>

              </div>

            </div>

          )}

        </div>

      </DialogContent>

    </Dialog>

  );

}
