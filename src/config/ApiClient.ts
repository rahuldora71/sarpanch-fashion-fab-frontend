import axios from "axios";
import { store } from "@/app/store";

/**
 * Resolves the backend base URL dynamically.
 * Priority:
 * 1. Explicit production/remote environment variable (e.g. Render backend URL).
 * 2. Mobile / LAN testing during local development (Vite dev server running on port 5173 / custom port).
 * 3. Default fallback to localhost:8082 or configured env URL.
 */
function getResolvedBaseUrl(defaultPath = "/api/v1"): string {
  const envUrl =
    defaultPath === ""
      ? import.meta.env.VITE_API_BASE_URL_ROOT
      : import.meta.env.VITE_API_BASE_URL;

  // In production builds or when explicit remote backend URL is provided, honor it directly
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // In development, when accessed from another device (mobile phone/tablet) connected to the same Wi-Fi
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    if (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      (window.location.port === "5173" || window.location.port === "3000")
    ) {
      return `${protocol}//${hostname}:8082${defaultPath}`;
    }
  }

  return envUrl || `http://localhost:8082${defaultPath}`;
}

function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      // Dynamic fallback for LAN / Wi-Fi IP if baseURL was initialized with localhost during local dev
      if (
        typeof window !== "undefined" &&
        window.location?.hostname &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1" &&
        (window.location.port === "5173" || window.location.port === "3000")
      ) {
        if (config.baseURL && config.baseURL.includes("localhost")) {
          config.baseURL = config.baseURL.replace("localhost", window.location.hostname);
        } else if (config.baseURL && config.baseURL.includes("127.0.0.1")) {
          config.baseURL = config.baseURL.replace("127.0.0.1", window.location.hostname);
        }
      }

      const token =
        store.getState().auth.accessToken;

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      /*
       * FormData requests must NOT use
       * application/json.
       *
       * Let the browser/Axios generate:
       *
       * Content-Type:
       * multipart/form-data; boundary=...
       */
      if (
        config.data instanceof FormData
      ) {
        delete config.headers[
          "Content-Type"
        ];
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  return client;
}

/** Existing versioned API: http://localhost:8082/api/v1 (or dynamic Wi-Fi IP) */
const apiClient = createApiClient(getResolvedBaseUrl("/api/v1"));

/** Root API used by the aggregate order and measurement-profile endpoints. */
export const apiRootClient = createApiClient(getResolvedBaseUrl(""));

export default apiClient;
