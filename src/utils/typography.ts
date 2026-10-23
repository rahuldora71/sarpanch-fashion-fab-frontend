export type FontFamilyId =
  | "inter"
  | "roboto"
  | "opensans"
  | "lato"
  | "nunitosans"
  | "system";

export type FontSizePreset = "small" | "default" | "large" | "extralarge";

export interface TypographySettings {
  fontFamily: FontFamilyId;
  fontSizePreset: FontSizePreset;
  fontSizePercent: number; // 85 to 125
}

export interface FontFamilyOption {
  id: FontFamilyId;
  label: string;
  cssFamily: string;
  category: string;
  previewSample: string;
}

export interface FontSizePresetOption {
  id: FontSizePreset;
  label: string;
  percent: number;
  description: string;
}

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    id: "inter",
    label: "Inter",
    cssFamily: "'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif",
    category: "Modern Sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "roboto",
    label: "Roboto",
    cssFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    category: "Geometric Sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "opensans",
    label: "Open Sans",
    cssFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    category: "Humanist Sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "lato",
    label: "Lato",
    cssFamily: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif",
    category: "Balanced Sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "nunitosans",
    label: "Nunito Sans",
    cssFamily: "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    category: "Clean Rounded Sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "system",
    label: "System Default",
    cssFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    category: "Native Platform",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
];

export const FONT_SIZE_PRESETS: FontSizePresetOption[] = [
  {
    id: "small",
    label: "Small",
    percent: 90,
    description: "Compact & high-density view (90%)",
  },
  {
    id: "default",
    label: "Default",
    percent: 100,
    description: "Standard balanced ERP view (100%)",
  },
  {
    id: "large",
    label: "Large",
    percent: 110,
    description: "Comfortable enhanced reading (110%)",
  },
  {
    id: "extralarge",
    label: "Extra Large",
    percent: 120,
    description: "Accessibility & high visibility (120%)",
  },
];

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  fontFamily: "inter",
  fontSizePreset: "default",
  fontSizePercent: 100,
};

const TYPOGRAPHY_STORAGE_KEY = "sff_typography_settings";

/**
 * Retrieve saved typography settings from localStorage with safe fallback.
 */
export function getStoredTypography(): TypographySettings {
  if (typeof window === "undefined") {
    return DEFAULT_TYPOGRAPHY_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
    if (!raw) return DEFAULT_TYPOGRAPHY_SETTINGS;

    const parsed = JSON.parse(raw);
    const validFamilies: FontFamilyId[] = [
      "inter",
      "roboto",
      "opensans",
      "lato",
      "nunitosans",
      "system",
    ];

    const family = validFamilies.includes(parsed.fontFamily)
      ? (parsed.fontFamily as FontFamilyId)
      : "inter";

    const percent =
      typeof parsed.fontSizePercent === "number" &&
      parsed.fontSizePercent >= 80 &&
      parsed.fontSizePercent <= 130
        ? parsed.fontSizePercent
        : 100;

    let preset: FontSizePreset = "default";
    if (percent <= 92) preset = "small";
    else if (percent >= 118) preset = "extralarge";
    else if (percent >= 106) preset = "large";

    return {
      fontFamily: family,
      fontSizePreset: preset,
      fontSizePercent: percent,
    };
  } catch {
    return DEFAULT_TYPOGRAPHY_SETTINGS;
  }
}

/**
 * Apply typography variables to the document root immediately.
 */
export function applyTypography(settings: TypographySettings): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const fontOpt =
    FONT_FAMILY_OPTIONS.find((f) => f.id === settings.fontFamily) ||
    FONT_FAMILY_OPTIONS[0];

  root.style.setProperty("--app-font-family", fontOpt.cssFamily);
  root.style.setProperty("--app-font-scale", `${settings.fontSizePercent}%`);
}

/**
 * Save typography settings and apply to document.
 */
export function saveTypography(settings: TypographySettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save typography settings", e);
  }

  applyTypography(settings);
}

/**
 * Reset typography settings back to factory default.
 */
export function resetTypography(): TypographySettings {
  saveTypography(DEFAULT_TYPOGRAPHY_SETTINGS);
  return DEFAULT_TYPOGRAPHY_SETTINGS;
}
