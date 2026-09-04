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


import axios from "axios";
import { store } from "@/app/store";

function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use(
  (config) => {
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

/** Existing versioned API: http://localhost:8082/api/v1 */
const apiClient = createApiClient(import.meta.env.VITE_API_BASE_URL);

/** Root API used by the aggregate order and measurement-profile endpoints. */
export const apiRootClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL_ROOT ?? "http://localhost:8082",
);

export default apiClient;
