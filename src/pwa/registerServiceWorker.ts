/**
 * Service Worker Registration for Sarpanch Fashion Fab PWA
 */

export function registerServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }

  // Chromium strictly requires a Secure Context (HTTPS or localhost) for Service Workers & PWA installation
  if (!window.isSecureContext) {
    console.info(
      "[PWA] Service Worker registration skipped: Origin (" +
        window.location.origin +
        ") is not a Secure Context (HTTPS or localhost).\n" +
        "To test on Android:\n" +
        "1. Chrome DevTools USB Port Forwarding: access http://localhost:5173 on phone.\n" +
        "2. Or add " +
        window.location.origin +
        " to chrome://flags/#unsafely-treat-insecure-origin-as-secure"
    );
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("[PWA] New version available; app updated.");
              } else {
                console.log("[PWA] App ready for offline shell usage.");
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn("[PWA] Service worker registration failed:", error);
      });
  });
}
