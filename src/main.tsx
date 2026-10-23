import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { initializeTheme, watchSystemTheme } from "@/utils/theme";
import { getStoredTypography, applyTypography } from "@/utils/typography";
import "@/i18n";
import { WorkerLanguageSynchronizer } from "@/i18n/WorkerLanguageSynchronizer";
import { registerServiceWorker } from "@/pwa/registerServiceWorker";
import App from "./App";
import "./App.css";

import { store } from "@/app/store";

// Register progressive web app service worker
registerServiceWorker();

// Apply theme immediately
initializeTheme();

// Apply typography immediately
applyTypography(getStoredTypography());

// Follow device changes when using system theme
watchSystemTheme();
ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <Provider store={store}>
      <WorkerLanguageSynchronizer />
      <App />
    </Provider>
  </React.StrictMode>
);