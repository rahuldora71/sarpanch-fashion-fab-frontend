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
  const response =
    await apiClient.get<ServiceMeasurementConfig>(
      `/services/${serviceId}`,
    );

  return response.data;
}

/* =========================================================
   LATEST CUSTOMER MEASUREMENT
   ========================================================= */

export async function getLatestMeasurement(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary | null> {
  try {
    const response =
      await apiClient.get<MeasurementSourceSummary>(
        `/measurements/customer/${customerId}/service/${serviceId}/latest`,
      );

    return response.data;
  } catch (error: unknown) {
    /*
     * 404 means the customer simply doesn't
     * have a previous measurement.
     */
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * Retrieves every latest measurement available for a customer in one request.
 * Unlike the per-service endpoint, a missing history for one service does not
 * produce a 404 response.
 */
export async function getLatestMeasurementsPerService(
  customerId: number,
): Promise<MeasurementSourceSummary[]> {
  const response = await apiClient.get<
    Array<
      Omit<MeasurementSourceSummary, "id" | "userId"> & {
        measurementId: number;
      }
    >
  >(`/measurements/customer/${customerId}/latest-per-service`);

  return response.data.map((measurement) => ({
    ...measurement,
    id: measurement.measurementId,
  }));
}

/* =========================================================
   MEASUREMENT COPY SOURCES
   ========================================================= */

export async function getMeasurementCopySources(
  customerId: number,
  serviceId: number,
): Promise<MeasurementSourceSummary[]> {
  const response =
    await apiClient.get<
      MeasurementSourceSummary[]
    >(
      `/measurements/customer/${customerId}/service/${serviceId}/copy-sources`,
    );

  return response.data;
}

/* =========================================================
   GET MEASUREMENT BY ID
   ========================================================= */

export async function getMeasurement(
  measurementId: number,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.get<MeasurementResponse>(
      `/measurements/${measurementId}`,
    );

  return response.data;
}

/* =========================================================
   CREATE MEASUREMENT
   ========================================================= */

export async function createMeasurement(
  data: MeasurementRequest,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.post<MeasurementResponse>(
      "/measurements",
      data,
    );

  return response.data;
}

/* =========================================================
   UPDATE MEASUREMENT
   ========================================================= */

export async function updateMeasurement(
  measurementId: number,
  data: MeasurementUpdateRequest,
): Promise<MeasurementResponse> {
  const response =
    await apiClient.patch<MeasurementResponse>(
      `/measurements/${measurementId}`,
      data,
    );

  return response.data;
}

/* =========================================================
   DELETE MEASUREMENT
   ========================================================= */

export async function deleteMeasurement(
  measurementId: number,
): Promise<void> {
  await apiClient.delete(
    `/measurements/${measurementId}`,
  );
}
