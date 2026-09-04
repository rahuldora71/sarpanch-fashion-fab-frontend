import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { initializeTheme,  watchSystemTheme,} from "@/utils/theme";
import App from "./App";
import "./App.css";

import { store } from "@/app/store";

// Apply theme immediately
initializeTheme();

// Follow device changes when using system theme
watchSystemTheme();
ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);