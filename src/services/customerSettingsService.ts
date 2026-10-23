export interface CustomerImageSettings {
  maxImagesPerCustomer: number;
  defaultCameraFacingMode: "environment" | "user";
  preferredPostureRatio: "3:4" | "16:9" | "1:1";
  enableCountdown: boolean;
  autoSaveToProfile: boolean;
}

const SETTINGS_KEY = "sff_customer_image_settings";

export const DEFAULT_CUSTOMER_IMAGE_SETTINGS: CustomerImageSettings = {
  maxImagesPerCustomer: 5,
  defaultCameraFacingMode: "environment",
  preferredPostureRatio: "3:4",
  enableCountdown: true,
  autoSaveToProfile: true,
};

export function getCustomerImageSettings(): CustomerImageSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_CUSTOMER_IMAGE_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      maxImagesPerCustomer:
        typeof parsed.maxImagesPerCustomer === "number" && parsed.maxImagesPerCustomer > 0
          ? Math.min(Math.max(parsed.maxImagesPerCustomer, 1), 20)
          : DEFAULT_CUSTOMER_IMAGE_SETTINGS.maxImagesPerCustomer,
      defaultCameraFacingMode:
        parsed.defaultCameraFacingMode === "user" ? "user" : "environment",
      preferredPostureRatio:
        parsed.preferredPostureRatio === "16:9" || parsed.preferredPostureRatio === "1:1"
          ? parsed.preferredPostureRatio
          : "3:4",
      enableCountdown: parsed.enableCountdown !== false,
      autoSaveToProfile: parsed.autoSaveToProfile !== false,
    };
  } catch (error) {
    console.error("Failed to load customer image settings:", error);
    return { ...DEFAULT_CUSTOMER_IMAGE_SETTINGS };
  }
}

export function saveCustomerImageSettings(settings: CustomerImageSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("customer-image-settings-changed", { detail: settings }));
  } catch (error) {
    console.error("Failed to save customer image settings:", error);
  }
}
