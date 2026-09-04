import apiClient from "@/config/ApiClient";
import axios from "axios";

import type {
  MeasurementFieldDefinition,
  MeasurementSourceSummary,
  ServiceMeasurementConfig,
  MeasurementResponse,
  MeasurementRequest,
  MeasurementUpdateRequest,
} from "@/types/measurement";

/* =========================================================
   PAGINATION
   ========================================================= */

interface PageResponse<T> {
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

export async function getMeasurementFieldDefinitions(
  page = 0,
  size = 100,
  sort = "name,asc",
): Promise<MeasurementFieldDefinition[]> {
  const response = await apiClient.get<
    MeasurementFieldDefinition[] | PageResponse<MeasurementFieldDefinition>
  >("/fields", {
    params: {
      page,
      size,
      sort,
    },
  });

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data.content ?? [];
}

/* =========================================================
   SERVICE MEASUREMENT CONFIGURATION
   ========================================================= */

export async function getServiceMeasurementConfig(
  serviceId: number,
): Promise<ServiceMeasurementConfig> {
  const response = await apiClient.get<ServiceMeasurementConfig>(
    `/services/${serviceId}`,
  );

  return response.data;
}

/* =========================================================
   LATEST CUSTOMER MEASUREMENT
   ========================================================= */

/**
 * Get the latest measurement for a customer and service.
 *
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/service/{serviceId}/latest
 */
export async function getLatestMeasurement(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary | null> {
  try {
    const response = await apiClient.get<MeasurementSourceSummary>(
      `/garment-measurements/customer/${customerId}/service/${serviceId}/latest`,
    );

    return response.data;
  } catch (error: unknown) {
    /*
     * 404 means the customer does not have
     * a previous measurement for this service.
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
 * Get measurement sources that can be used to copy
 * measurements for the target service.
 *
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/service/{serviceId}/copy-sources
 */
export async function getMeasurementCopySources(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary[]> {
  const response = await apiClient.get<MeasurementSourceSummary[]>(
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
  const response = await apiClient.get<MeasurementResponse>(
    `/garment-measurements/${measurementId}`,
  );

  return response.data;
}

/* =========================================================
   GET MEASUREMENT BY GARMENT
   ========================================================= */

/**
 * Get the measurement belonging to a specific garment.
 *
 * GET:
 * /api/v1/garment-measurements/garment/{garmentId}
 */
export async function getMeasurementByGarment(
  garmentId: number,
): Promise<MeasurementResponse> {
  const response = await apiClient.get<MeasurementResponse>(
    `/garment-measurements/garment/${garmentId}`,
  );

  return response.data;
}

/* =========================================================
   GET CUSTOMER MEASUREMENT HISTORY
   ========================================================= */

/**
 * Get all measurements of a customer.
 *
 * GET:
 * /api/v1/garment-measurements/customer/{userId}
 */
export async function getCustomerMeasurements(
  customerId: number,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
): Promise<PageResponse<MeasurementResponse>> {
  const response = await apiClient.get<PageResponse<MeasurementResponse>>(
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
 * Get measurement history for a customer and service.
 *
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
    await apiClient.get<PageResponse<MeasurementResponse>>(
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
 * Get the latest measurement for each service
 * belonging to a customer.
 *
 * GET:
 * /api/v1/garment-measurements/customer/{userId}/latest-per-service
 */
export async function getLatestMeasurementsPerService(
  customerId: number,
): Promise<MeasurementSourceSummary[]> {
  const response =
    await apiClient.get<MeasurementSourceSummary[]>(
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
  data: MeasurementRequest,
): Promise<MeasurementResponse> {
  const response = await apiClient.post<MeasurementResponse>(
    "/garment-measurements",
    data,
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
 * Lock or unlock a measurement.
 *
 * PATCH:
 * /api/v1/garment-measurements/{measurementId}/editable?editable=true
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