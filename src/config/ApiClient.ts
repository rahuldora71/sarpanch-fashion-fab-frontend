// import axios from "axios";
// import { store } from "@/app/store";

// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,

//   headers: {
//     "Content-Type": "application/json",
//   },

//   withCredentials: true,
// });

// apiClient.interceptors.request.use(
//   (config) => {
//     const token =
//       store.getState().auth.accessToken;

//     if (token) {
//       config.headers.Authorization =
//         `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default apiClient;


// 11111111111111111111111

import axios from "axios";
import { store } from "@/app/store";

/**
 * Resolves the backend base URL dynamically.
 * In a development environment, when accessed from another device (mobile phone or tablet)
 * connected to the same Wi-Fi, window.location.hostname will be the host machine's IP (e.g. 192.168.1.5).
 * By using window.location.hostname, API requests automatically route to the host machine's Spring Boot server.
 */
function getResolvedBaseUrl(defaultPath = "/api/v1"): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    if (window.location.port === "" || window.location.port === "443" || window.location.port === "80") {
      return `${protocol}//${hostname}${defaultPath}`;
    }
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:8082${defaultPath}`;
    }
  }
  const envUrl =
    defaultPath === ""
      ? import.meta.env.VITE_API_BASE_URL_ROOT
      : import.meta.env.VITE_API_BASE_URL;
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
      // Dynamic fallback for LAN / Wi-Fi IP if baseURL was initialized with localhost
      if (
        typeof window !== "undefined" &&
        window.location?.hostname &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
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


// 22222222222222222

// import axios from "axios";
// import { store } from "@/app/store";

// function createApiClient(baseURL: string) {
//   const client = axios.create({
//     baseURL,
//     headers: { "Content-Type": "application/json" },
//     withCredentials: true,
//   });

//   client.interceptors.request.use(
//     (config) => {
//       const token = store.getState().auth.accessToken;

//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }

//       if (config.data instanceof FormData) {
//         delete config.headers["Content-Type"];
//       }

//       return config;
//     },
//     (error) => Promise.reject(error),
//   );

//   return client;
// }

// /** Versioned API requests are routed through Vite. */
// const apiClient = createApiClient(
//   import.meta.env.VITE_API_BASE_URL,
// );

// /** Root client uses same-origin relative URLs as well. */
// export const apiRootClient = createApiClient(
//   import.meta.env.VITE_API_BASE_URL_ROOT ?? "",
// );

// export default apiClient;
