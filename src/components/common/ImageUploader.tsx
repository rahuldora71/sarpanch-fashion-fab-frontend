import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Cropper, {
  type Area,
} from "react-easy-crop";

import {
  ImagePlus,
  Loader2,
  RotateCcw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
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
  uploadImage,
} from "@/services/imageService";

import type {
  UploadedImage,
} from "@/types/image";

interface ImageUploaderValue {
  imageUrl: string;
  imagePublicId: string;
}

interface ImageUploaderProps {
  value?: ImageUploaderValue;
  onChange: (
    image: UploadedImage,
  ) => void;
  onRemove?: () => void;
  aspect?: number;
  disabled?: boolean;
  maxSizeMB?: number;
}

interface CroppedImageResult {
  file: File;
  width: number;
  height: number;
}

const DEFAULT_ASPECT = 1;
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const ROTATION_STEP = 90;
const JPEG_QUALITY = 0.85;

const createImage = (
  url: string,
): Promise<HTMLImageElement> =>
  new Promise(
    (
      resolve,
      reject,
    ) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = reject;

      image.src = url;
    },
  );

const getRotatedSize = (
  width: number,
  height: number,
  rotation: number,
) => {
  const radians =
    (rotation * Math.PI) /
    180;

  return {
    width:
      Math.abs(
        Math.cos(radians) *
          width,
      ) +
      Math.abs(
        Math.sin(radians) *
          height,
      ),

    height:
      Math.abs(
        Math.sin(radians) *
          width,
      ) +
      Math.abs(
        Math.cos(radians) *
          height,
      ),
  };
};

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
): Promise<CroppedImageResult> => {
  const image =
    await createImage(
      imageSrc,
    );

  const rotatedSize =
    getRotatedSize(
      image.width,
      image.height,
      rotation,
    );

  const rotationCanvas =
    document.createElement(
      "canvas",
    );

  const rotationContext =
    rotationCanvas.getContext(
      "2d",
    );

  if (!rotationContext) {
    throw new Error(
      "Could not create canvas context",
    );
  }

  rotationCanvas.width =
    Math.round(
      rotatedSize.width,
    );

  rotationCanvas.height =
    Math.round(
      rotatedSize.height,
    );

  rotationContext.translate(
    rotationCanvas.width / 2,
    rotationCanvas.height / 2,
  );

  rotationContext.rotate(
    (rotation * Math.PI) /
      180,
  );

  rotationContext.drawImage(
    image,
    -image.width / 2,
    -image.height / 2,
  );

  const croppedCanvas =
    document.createElement(
      "canvas",
    );

  const croppedContext =
    croppedCanvas.getContext(
      "2d",
    );

  if (!croppedContext) {
    throw new Error(
      "Could not create cropped canvas context",
    );
  }

  croppedCanvas.width =
    Math.round(
      pixelCrop.width,
    );

  croppedCanvas.height =
    Math.round(
      pixelCrop.height,
    );

  croppedContext.drawImage(
    rotationCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  const blob =
    await new Promise<Blob>(
      (
        resolve,
        reject,
      ) => {
        croppedCanvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(
                new Error(
                  "Could not create image blob",
                ),
              );
            }
          },
          "image/jpeg",
          JPEG_QUALITY,
        );
      },
    );

  const file = new File(
    [blob],
    `image-${Date.now()}.jpg`,
    {
      type: "image/jpeg",
    },
  );

  return {
    file,
    width:
      croppedCanvas.width,
    height:
      croppedCanvas.height,
  };
};

export function ImageUploader({
  value,
  onChange,
  onRemove,
  aspect = DEFAULT_ASPECT,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: ImageUploaderProps) {
  const [open, setOpen] =
    useState(false);

  const [imageSrc, setImageSrc] =
    useState<string | null>(
      null,
    );

  const [crop, setCrop] =
    useState({
      x: 0,
      y: 0,
    });

  const [zoom, setZoom] =
    useState(
      DEFAULT_ZOOM,
    );

  const [rotation, setRotation] =
    useState(0);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState<Area | null>(
    null,
  );

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const onCropComplete =
    useCallback(
      (
        _croppedArea: Area,
        croppedPixels: Area,
      ) => {
        setCroppedAreaPixels(
          croppedPixels,
        );
      },
      [],
    );

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(
          imageSrc,
        );
      }
    };
  }, [imageSrc]);

  const resetCropState = () => {
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(
      DEFAULT_ZOOM,
    );

    setRotation(0);

    setCroppedAreaPixels(
      null,
    );
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setError(
        "Please select a valid image.",
      );
      return;
    }

    if (
      file.size >
      maxSizeMB * 1024 * 1024
    ) {
      setError(
        `Image must be smaller than ${maxSizeMB} MB.`,
      );
      return;
    }

    if (imageSrc) {
      URL.revokeObjectURL(
        imageSrc,
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file,
      );

    setImageSrc(
      previewUrl,
    );

    resetCropState();

    setOpen(true);
  };

  const handleCropAndUpload =
    async () => {
      if (
        !imageSrc ||
        !croppedAreaPixels
      ) {
        return;
      }

      try {
        setUploading(true);
        setError(null);

        const cropped =
          await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            rotation,
          );

        const response =
          await uploadImage(
            cropped.file,
          );

        console.log(
          "Uploaded image response:",
          response,
        );

        if (
          !response ||
          !response.imageUrl
        ) {
          throw new Error(
            "Image upload succeeded but no imageUrl was returned.",
          );
        }

        /*
         * IMPORTANT:
         *
         * Backend returns:
         *
         * {
         *   imageUrl: "...",
         *   publicId: "sff/images/..."
         * }
         *
         * We map publicId -> imagePublicId
         */
        onChange({
          imageUrl:
            response.imageUrl,

          imagePublicId:
            response.publicId ??
            "",
        });

        setOpen(false);

        URL.revokeObjectURL(
          imageSrc,
        );

        setImageSrc(null);

        resetCropState();
      } catch (err) {
        console.error(
          "Image upload failed:",
          err,
        );

        setError(
          "Failed to upload image. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    };

  const handleDialogChange = (
    nextOpen: boolean,
  ) => {
    if (uploading) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      if (imageSrc) {
        URL.revokeObjectURL(
          imageSrc,
        );
      }

      setImageSrc(null);
      setError(null);

      resetCropState();
    }
  };

  const handleZoomOut = () => {
    setZoom(
      (current) =>
        Math.max(
          MIN_ZOOM,
          Number(
            (
              current -
              ZOOM_STEP
            ).toFixed(2),
          ),
        ),
    );
  };

  const handleZoomIn = () => {
    setZoom(
      (current) =>
        Math.min(
          MAX_ZOOM,
          Number(
            (
              current +
              ZOOM_STEP
            ).toFixed(2),
          ),
        ),
    );
  };

  const handleRotate = () => {
    setRotation(
      (current) =>
        (current +
          ROTATION_STEP) %
        360,
    );
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {value?.imageUrl ? (
              <img
                src={value.imageUrl}
                alt="Add-on"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}

            {value?.imageUrl &&
              onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 rounded-full"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <label
              htmlFor="image-upload"
              className={`
                inline-flex
                h-10
                cursor-pointer
                items-center
                justify-center
                rounded-md
                border
                bg-background
                px-4
                py-2
                text-sm
                font-medium
                shadow-sm
                transition-colors
                hover:bg-accent
                hover:text-accent-foreground
                ${
                  disabled
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              `}
            >
              <Upload className="mr-2 h-4 w-4" />

              {value?.imageUrl
                ? "Change image"
                : "Upload image"}

              <input
                id="image-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={
                  handleFileChange
                }
                disabled={disabled}
              />
            </label>

            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP · Max{" "}
              {maxSizeMB} MB
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog
        open={open}
        onOpenChange={
          handleDialogChange
        }
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              Adjust image
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 p-6">
            {/* Cropper */}
            <div className="relative h-[360px] w-full overflow-hidden rounded-xl bg-black">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={
                    rotation
                  }
                  aspect={aspect}
                  onCropChange={
                    setCrop
                  }
                  onZoomChange={
                    setZoom
                  }
                  onRotationChange={
                    setRotation
                  }
                  onCropComplete={
                    onCropComplete
                  }
                  restrictPosition
                />
              )}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={
                  handleZoomOut
                }
                disabled={
                  zoom <= MIN_ZOOM
                }
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.05"
                value={zoom}
                onChange={(
                  event,
                ) => {
                  const nextZoom =
                    Number(
                      event.target
                        .value,
                    );

                  if (
                    Number.isFinite(
                      nextZoom,
                    )
                  ) {
                    setZoom(
                      nextZoom,
                    );
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                aria-label="Image zoom"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={
                  handleZoomIn
                }
                disabled={
                  zoom >= MAX_ZOOM
                }
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Rotation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Rotation
                </p>

                <p className="text-xs text-muted-foreground">
                  Rotate the image before uploading
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={
                  handleRotate
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Rotate
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleDialogChange(
                    false,
                  )
                }
                disabled={
                  uploading
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={
                  handleCropAndUpload
                }
                disabled={
                  uploading ||
                  !croppedAreaPixels
                }
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Crop & upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}