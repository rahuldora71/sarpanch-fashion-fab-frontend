import apiClient from "@/config/ApiClient";
import { APP_CONFIG } from "@/config/appConfig";

import type {
  Service,
  ServiceCreateRequest,
  ServiceUpdateRequest,
  ServicePageResponse,
} from "@/types/service";


// =========================================================
// DEFAULTS
// =========================================================

const DEFAULT_PAGE_SIZE =
  APP_CONFIG.services?.pageSize ?? 100;

const DEFAULT_SORT =
  "createdAt,desc";


// =========================================================
// CREATE SERVICE
// POST /services
// =========================================================

export const createService = async (
  data: ServiceCreateRequest,
): Promise<Service> => {
  const response =
    await apiClient.post<Service>(
      "/services",
      data,
    );

  return response.data;
};


// =========================================================
// GET SERVICES
// GET /services
// =========================================================

export const getServices = async (
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<ServicePageResponse> => {
  const response =
    await apiClient.get<ServicePageResponse>(
      "/services",
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
};


// =========================================================
// SEARCH SERVICES
// GET /services/search
// =========================================================

export const searchServices = async (
  keyword: string,
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<ServicePageResponse> => {
  const response =
    await apiClient.get<ServicePageResponse>(
      "/services/search",
      {
        params: {
          keyword: keyword.trim(),
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
};


// =========================================================
// GET ACTIVE SERVICES
// GET /services/active
// =========================================================

export const getActiveServices = async (
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<Service[]> => {
  const response =
    await apiClient.get<ServicePageResponse>(
      "/services/active",
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data.content ?? [];
};


// =========================================================
// GET INACTIVE SERVICES
// GET /services/inactive
// =========================================================

export const getInactiveServices = async (
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<Service[]> => {
  const response =
    await apiClient.get<ServicePageResponse>(
      "/services/inactive",
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data.content ?? [];
};


// =========================================================
// GET SERVICES BY CATEGORY
// GET /services/category/{category}
// =========================================================

export const getServicesByCategory = async (
  category: string,
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<ServicePageResponse> => {
  const response =
    await apiClient.get<ServicePageResponse>(
      `/services/category/${encodeURIComponent(category)}`,
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
};


// =========================================================
// GET SERVICE BY ID
// GET /services/{id}
// =========================================================

export const getServiceById = async (
  id: number,
): Promise<Service> => {
  const response =
    await apiClient.get<Service>(
      `/services/${id}`,
    );

  return response.data;
};


// =========================================================
// UPDATE SERVICE
// PATCH /services/{id}
// =========================================================

export const updateService = async (
  id: number,
  data: ServiceUpdateRequest,
): Promise<Service> => {
  const response =
    await apiClient.patch<Service>(
      `/services/${id}`,
      data,
    );

  return response.data;
};


// =========================================================
// CHANGE SERVICE STATUS
// PATCH /services/{id}/status?active=false
// =========================================================

export const updateServiceStatus = async (
  id: number,
  active: boolean,
): Promise<Service> => {
  const response =
    await apiClient.patch<Service>(
      `/services/${id}/status`,
      null,
      {
        params: {
          active,
        },
      },
    );

  return response.data;
};


// =========================================================
// DELETE SERVICE
// DELETE /services/{id}
// =========================================================

export const deleteService = async (
  id: number,
): Promise<void> => {
  await apiClient.delete(
    `/services/${id}`,
  );
};