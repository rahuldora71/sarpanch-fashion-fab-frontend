export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "sarpanch-theme";

/**
 * Get the device/browser preferred theme.
 */
export const getSystemTheme = (): "light" | "dark" => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

/**
 * Get the theme saved by the user.
 *
 * If nothing has been saved, use "system".
 */
export const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme =
    localStorage.getItem(THEME_STORAGE_KEY);

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
};

/**
 * Apply the actual theme to the document.
 *
 * shadcn uses the "dark" class on <html>.
 *
 * Light:
 * <html>
 *
 * Dark:
 * <html class="dark">
 */
export const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  const actualTheme =
    theme === "system"
      ? getSystemTheme()
      : theme;

  root.classList.remove("light", "dark");

  root.classList.add(actualTheme);
};

/**
 * Save the user's theme preference.
 */
export const setTheme = (theme: Theme): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    THEME_STORAGE_KEY,
    theme
  );

  applyTheme(theme);
};

/**
 * Get the currently effective theme.
 *
 * If the preference is "system", this returns
 * the actual device theme.
 */
export const getCurrentTheme = (): "light" | "dark" => {
  const theme = getStoredTheme();

  if (theme === "system") {
    return getSystemTheme();
  }

  return theme;
};

/**
 * Toggle between light and dark.
 *
 * If the current theme is light -> dark.
 * If the current theme is dark -> light.
 */
export const toggleTheme = (): "light" | "dark" => {
  const currentTheme = getCurrentTheme();

  const newTheme =
    currentTheme === "dark"
      ? "light"
      : "dark";

  setTheme(newTheme);

  return newTheme;
};

/**
 * Initialize the application theme.
 *
 * This should be called once when the application starts.
 */
export const initializeTheme = (): void => {
  const theme = getStoredTheme();

  applyTheme(theme);
};

/**
 * Listen for device theme changes.
 *
 * This only follows the device when the user has
 * selected "system" or hasn't selected a theme.
 */
export const watchSystemTheme = (): (() => void) | undefined => {
  if (typeof window === "undefined") {
    return;
  }

  const mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  const handleChange = () => {
    const storedTheme = getStoredTheme();

    if (storedTheme === "system") {
      applyTheme("system");
    }
  };

  mediaQuery.addEventListener(
    "change",
    handleChange
  );

  return () => {
    mediaQuery.removeEventListener(
      "change",
      handleChange
    );
  };
};