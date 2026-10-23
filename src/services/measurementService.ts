import apiClient from "@/config/ApiClient";
import axios from "axios";
import { store } from "@/app/store";

import type { GarmentMeasurementRequest } from "@/services/orderService";

import type {
  MeasurementFieldDefinition,
  MeasurementSourceSummary,
  ServiceMeasurementConfig,
  MeasurementResponse,
  MeasurementUpdateRequest,
  MeasurementRequest,
} from "@/types/measurement";

/* =========================================================
   PAGINATION
========================================================= */

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  content: T[];
  empty: boolean;
}

/* =========================================================
   GLOBAL MEASUREMENT FIELD DEFINITIONS
========================================================= */

/**
 * Get all reusable measurement fields.
 *
 * API:
 * GET /api/v1/fields?page=0&size=100&sort=name,asc
 *
 * Example:
 *
 * FIELD ID     FIELD NAME
 * 1            Chest
 * 2            Waist
 * 3            Shoulder
 * 4            Sleeve
 */
export async function getMeasurementFieldDefinitions(
  page = 0,
  size = 100,
  sort = "name,asc",
): Promise<MeasurementFieldDefinition[]> {
  const response = await apiClient.get<
    MeasurementFieldDefinition[] |
    PageResponse<MeasurementFieldDefinition>
  >(
    "/fields",
    {
      params: {
        page,
        size,
        sort,
      },
    },
  );

  const data = response.data;

  /*
   * Some backend versions may return:
   *
   * {
   *   content: [...]
   * }
   *
   * while another version may return:
   *
   * [...]
   *
   * Support both.
   */

  if (Array.isArray(data)) {
    return data;
  }

  return data.content ?? [];
}

/* =========================================================
   FIELD LOOKUP MAP
========================================================= */

/**
 * Loads all measurement fields and converts them into
 * a Map for fast lookup.
 *
 * Example:
 *
 * 1 -> Chest
 * 4 -> Shoulder
 * 6 -> Waist
 */
export async function getMeasurementFieldMap(): Promise<
  Map<number, MeasurementFieldDefinition>
> {
  const fields =
    await getMeasurementFieldDefinitions(
      0,
      100,
      "name,asc",
    );

  return new Map(
    fields.map((field) => [
      field.id,
      field,
    ]),
  );
}

/* =========================================================
   GET FIELD BY ID
========================================================= */

/**
 * GET:
 * /api/v1/fields/{fieldId}
 */
export async function getMeasurementFieldById(
  fieldId: number,
): Promise<MeasurementFieldDefinition> {
  const response =
    await apiClient.get<MeasurementFieldDefinition>(
      `/fields/${fieldId}`,
    );

  return response.data;
}

/* =========================================================
   SEARCH MEASUREMENT FIELDS
========================================================= */

/**
 * GET:
 * /api/v1/fields/search
 */
export async function searchMeasurementFields(
  keyword: string,
  page = 0,
  size = 100,
  sort = "name,asc",
): Promise<MeasurementFieldDefinition[]> {
  const response =
    await apiClient.get<
      PageResponse<MeasurementFieldDefinition>
      | MeasurementFieldDefinition[]
    >(
      "/fields/search",
      {
        params: {
          keyword,
          page,
          size,
          sort,
        },
      },
    );

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data.content ?? [];
}

/* =========================================================
   SERVICE MEASUREMENT CONFIGURATION
========================================================= */

/**
 * GET:
 * /api/v1/services/{serviceId}
 *
 * The service response contains the measurement
 * configuration for that service.
 */
export async function getServiceMeasurementConfig(
  serviceId: number,
): Promise<ServiceMeasurementConfig> {
  const response =
    await apiClient.get<ServiceMeasurementConfig>(
      `/services/${serviceId}`,
    );

  return response.data;
}

/* =========================================================
   LATEST CUSTOMER MEASUREMENT
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/service/{serviceId}/latest
 */
export async function getLatestMeasurement(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary | null> {
  try {
    const response =
      await apiClient.get<MeasurementSourceSummary>(
        `/garment-measurements/customer/${customerId}/service/${serviceId}/latest`,
      );

    return response.data;
  } catch (error: unknown) {
    /*
     * 404 means there is no previous measurement.
     *
     * Do NOT hide 401 / 403 errors.
     */
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return null;
    }

    throw error;
  }
}

/* =========================================================
   MEASUREMENT COPY SOURCES
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/service/{serviceId}/copy-sources
 */
export async function getMeasurementCopySources(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary[]> {
  const response =
    await apiClient.get<MeasurementSourceSummary[]>(
      `/garment-measurements/customer/${customerId}/service/${serviceId}/copy-sources`,
    );

  return response.data;
}

/* =========================================================
   GET MEASUREMENT BY ID
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/{measurementId}
 */
export async function getMeasurement(
  measurementId: number,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.get<MeasurementResponse>(
      `/garment-measurements/${measurementId}`,
    );

  return response.data;
}

/* =========================================================
   GET MEASUREMENT BY GARMENT
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/garment/{garmentId}
 */
export async function getMeasurementByGarment(
  garmentId: number,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.get<MeasurementResponse>(
      `/garment-measurements/garment/${garmentId}`,
    );

  return response.data;
}

/* =========================================================
   GET CUSTOMER MEASUREMENT HISTORY
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/customer/{userId}
 */
export async function getCustomerMeasurements(
  customerId: number,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
): Promise<PageResponse<MeasurementResponse>> {
  const response =
    await apiClient.get<
      PageResponse<MeasurementResponse>
    >(
      `/garment-measurements/customer/${customerId}`,
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
}

/* =========================================================
   GET CUSTOMER + SERVICE MEASUREMENT HISTORY
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/service/{serviceId}
 */
export async function getCustomerServiceMeasurements(
  customerId: number,
  serviceId: number,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
): Promise<PageResponse<MeasurementResponse>> {
  const response =
    await apiClient.get<
      PageResponse<MeasurementResponse>
    >(
      `/garment-measurements/customer/${customerId}/service/${serviceId}`,
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
}

/* =========================================================
   GET LATEST MEASUREMENT FOR EVERY SERVICE
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/latest-per-service
 *
 * Returns:
 *
 * Shirt  -> latest Shirt measurement
 * Pant   -> latest Pant measurement
 * Coat   -> latest Coat measurement
 */
export async function getLatestMeasurementsPerService(
  customerId: number,
): Promise<MeasurementSourceSummary[]> {
  const response =
    await apiClient.get<
      MeasurementSourceSummary[]
    >(
      `/garment-measurements/customer/${customerId}/latest-per-service`,
    );

  return response.data;
}

/* =========================================================
   CREATE MEASUREMENT
========================================================= */

/**
 * POST:
 * /api/v1/garment-measurements
 */
export async function createMeasurement(
  data: Omit<
    GarmentMeasurementRequest,
    "takenByUserId"
  >,
): Promise<MeasurementResponse> {
  const authenticatedUserId =
    store.getState().auth.user?.id;

  if (
    typeof authenticatedUserId !== "number" ||
    !Number.isSafeInteger(
      authenticatedUserId,
    ) ||
    authenticatedUserId <= 0
  ) {
    throw new Error(
      "Your authenticated user ID is unavailable. Please sign in again before saving a measurement.",
    );
  }

  const response =
    await apiClient.post<MeasurementResponse>(
      "/garment-measurements",
      {
        ...data,
        takenByUserId:
          authenticatedUserId,
      },
    );

  return response.data;
}

/* =========================================================
   CREATE CUSTOMER MEASUREMENT (DIRECT / STANDALONE)
========================================================= */

/**
 * POST:
 * /api/v1/garment-measurements/customer
 *
 * Saves a measurement directly for a customer and tailoring service,
 * without requiring an existing order or garment.
 */
export async function createCustomerMeasurement(
  data: MeasurementRequest,
): Promise<MeasurementResponse> {
  const authenticatedUserId =
    store.getState().auth.user?.id;

  const response =
    await apiClient.post<MeasurementResponse>(
      "/garment-measurements/customer",
      {
        ...data,
        takenByUserId:
          data.takenByUserId ?? authenticatedUserId,
      },
    );

  return response.data;
}

/* =========================================================
   GET ALL MEASUREMENTS (PAGINATED WITH SEARCH)
========================================================= */

/**
 * GET:
 * /api/v1/garment-measurements
 */
export async function getAllMeasurements(
  keyword?: string,
  page = 0,
  size = 20,
): Promise<PageResponse<MeasurementResponse>> {
  const response =
    await apiClient.get<PageResponse<MeasurementResponse>>(
      "/garment-measurements",
      {
        params: {
          keyword: keyword?.trim() || undefined,
          page,
          size,
        },
      },
    );

  return response.data;
}

/* =========================================================
   UPDATE MEASUREMENT
========================================================= */

/**
 * PATCH:
 * /api/v1/garment-measurements/{measurementId}
 */
export async function updateMeasurement(
  measurementId: number,
  data: MeasurementUpdateRequest,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.patch<MeasurementResponse>(
      `/garment-measurements/${measurementId}`,
      data,
    );

  return response.data;
}

/* =========================================================
   LOCK / UNLOCK MEASUREMENT
========================================================= */

/**
 * PATCH:
 * /api/v1/garment-measurements/{measurementId}/editable
 */
export async function updateMeasurementEditableStatus(
  measurementId: number,
  editable: boolean,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.patch<MeasurementResponse>(
      `/garment-measurements/${measurementId}/editable`,
      null,
      {
        params: {
          editable,
        },
      },
    );

  return response.data;
}

/* =========================================================
   DELETE MEASUREMENT
========================================================= */

/**
 * DELETE:
 * /api/v1/garment-measurements/{measurementId}
 */
export async function deleteMeasurement(
  measurementId: number,
): Promise<void> {
  await apiClient.delete(
    `/garment-measurements/${measurementId}`,
  );
}